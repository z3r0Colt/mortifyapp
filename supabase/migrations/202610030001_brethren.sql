create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  sex text not null check (sex in ('brother','sister')),
  church_name text check (char_length(church_name) <= 120),
  brethren_code text not null unique check (brethren_code ~ '^[A-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);
create table public.brethren_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','removed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(requester_id <> receiver_id)
);
create unique index one_link_per_pair on public.brethren_links (least(requester_id,receiver_id),greatest(requester_id,receiver_id));
create table public.shared_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  share_battles boolean not null default true, share_temptations boolean not null default true,
  share_falls boolean not null default false, share_blocker_status boolean not null default true
);
create table public.shared_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check(event_type in ('temptation','fall','stood_firm','blocker_off','blocker_on')),
  battle_id text check(battle_id ~ '^[a-z0-9-]{1,80}$'), created_at timestamptz not null default now(),
  client_id uuid not null default gen_random_uuid(), unique(user_id,client_id)
);
create index events_by_user on public.shared_events(user_id,created_at desc);
create table public.messages (
  id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message_type text not null check(message_type in ('pray_for_me','praying','checking_in','reply','encouragement')),
  body text check(char_length(body)<=500 and body !~* '(https?://|www\.|[a-z0-9-]+\.[a-z]{2,})'),
  parent_message_id uuid references public.messages(id) on delete set null,
  read boolean not null default false, created_at timestamptz not null default now(),
  check(sender_id<>receiver_id), check(message_type in ('reply','encouragement') or body is null)
);
create index messages_for_receiver on public.messages(receiver_id,created_at desc);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check(platform in ('web','android','ios')), subscription jsonb not null,
  device_id uuid not null, unique(user_id,device_id)
);
create table public.reminder_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  morning time not null default '07:00', evening time not null default '21:00',
  timezone text not null default 'UTC', enabled boolean not null default false
);
create table private.reminder_deliveries (
  user_id uuid references public.profiles(id) on delete cascade, slot text, local_date date,
  primary key(user_id,slot,local_date)
);
create table private.code_attempts (user_id uuid references auth.users(id) on delete cascade, attempted_at timestamptz not null default now());
create index attempts_by_user on private.code_attempts(user_id,attempted_at);

create function private.linked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.brethren_links l where l.status='accepted' and ((l.requester_id=a and l.receiver_id=b) or (l.requester_id=b and l.receiver_id=a)));
$$;
create function private.share_allowed(owner_id uuid, kind text) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select case when kind in ('temptation','stood_firm') then s.share_temptations when kind='fall' then s.share_falls else s.share_blocker_status end from public.shared_settings s where s.user_id=owner_id),false);
$$;
create function private.scrub_battle() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not (select share_battles from public.shared_settings where user_id=new.user_id) then new.battle_id=null; end if;
  return new;
end; $$;
create trigger scrub_event_battle before insert or update on public.shared_events for each row execute function private.scrub_battle();
create function private.sharing_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not new.share_battles then update public.shared_events set battle_id=null where user_id=new.user_id; end if;
  return new;
end; $$;
create trigger sharing_changed after update on public.shared_settings for each row execute function private.sharing_changed();

alter table public.profiles enable row level security;
alter table public.brethren_links enable row level security;
alter table public.shared_settings enable row level security;
alter table public.shared_events enable row level security;
alter table public.messages enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_settings enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or private.linked(auth.uid(),id));
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy links_read on public.brethren_links for select to authenticated using(auth.uid() in(requester_id,receiver_id));
create policy settings_read on public.shared_settings for select to authenticated using(user_id=auth.uid() or private.linked(auth.uid(),user_id));
create policy settings_update on public.shared_settings for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy events_read on public.shared_events for select to authenticated using(user_id=auth.uid() or (private.linked(auth.uid(),user_id) and private.share_allowed(user_id,event_type)));
create policy messages_read on public.messages for select to authenticated using(auth.uid() in(sender_id,receiver_id) and private.linked(sender_id,receiver_id));
create policy subscriptions_own on public.push_subscriptions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reminders_own on public.reminder_settings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.profiles,public.brethren_links,public.shared_settings,public.shared_events,public.messages,public.push_subscriptions,public.reminder_settings from anon,authenticated;
grant select on public.profiles,public.brethren_links,public.shared_settings,public.shared_events,public.messages to authenticated;
grant update(display_name,church_name) on public.profiles to authenticated;
grant update(share_battles,share_temptations,share_falls,share_blocker_status) on public.shared_settings to authenticated;
grant select,insert,update,delete on public.push_subscriptions,public.reminder_settings to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.linked(uuid,uuid),private.share_allowed(uuid,text) to authenticated;

create function public.create_profile(p_name text,p_sex text,p_church text default null) returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles; code text; bytes bytea; alphabet text='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  for attempt in 1..20 loop
    bytes=uuid_send(gen_random_uuid());code='';
    for i in 0..5 loop code=code||substr(alphabet,1+get_byte(bytes,i)%32,1); end loop;
    begin
      insert into public.profiles(id,display_name,sex,church_name,brethren_code) values(auth.uid(),trim(p_name),p_sex,nullif(trim(p_church),''),code) returning * into result;
      insert into public.shared_settings(user_id) values(auth.uid());
      insert into public.reminder_settings(user_id) values(auth.uid());
      return result;
    exception when unique_violation then
      if exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'A profile already exists'; end if;
    end;
  end loop;
  raise exception 'Please try creating your profile again';
end; $$;
create function public.lookup_brethren(p_code text) returns table(id uuid,display_name text,sex text,church_name text) language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first';end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from private.code_attempts where user_id=auth.uid() and attempted_at>now()-interval '1 hour')>=20 then return;end if;
  insert into private.code_attempts(user_id) values(auth.uid());
  delete from private.code_attempts where attempted_at<now()-interval '1 day';
  return query select p.id,p.display_name,p.sex,p.church_name from public.profiles p where p.brethren_code=upper(trim(p_code)) and p.id<>auth.uid();
end; $$;
create function private.validate_link(a uuid,b uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if a=b or not exists(select 1 from public.profiles p join public.profiles q on p.sex=q.sex where p.id=a and q.id=b) then raise exception 'Link only with a brother or sister of the same sex';end if;
  if (select count(*) from public.brethren_links where status='accepted' and a in(requester_id,receiver_id))>=8 or (select count(*) from public.brethren_links where status='accepted' and b in(requester_id,receiver_id))>=8 then raise exception 'A circle may have at most 8 brethren';end if;
end; $$;
create function public.request_link(p_code text) returns uuid language plpgsql security definer set search_path='' as $$
declare other_id uuid; result uuid;
begin
  perform pg_advisory_xact_lock(710310);
  select p.id into other_id from public.lookup_brethren(p_code) p;
  if other_id is null then raise exception 'Code unavailable. Check it with your brother or sister, or try later.';end if;
  perform private.validate_link(auth.uid(),other_id);
  if exists(select 1 from public.brethren_links where least(requester_id,receiver_id)=least(auth.uid(),other_id) and greatest(requester_id,receiver_id)=greatest(auth.uid(),other_id) and status<>'removed') then raise exception 'A link or request already exists';end if;
  insert into public.brethren_links(requester_id,receiver_id) values(auth.uid(),other_id)
  on conflict(least(requester_id,receiver_id),greatest(requester_id,receiver_id)) do update set requester_id=auth.uid(),receiver_id=other_id,status='pending',created_at=now(),updated_at=now() returning id into result;
  return result;
end; $$;
create function public.respond_link(p_link uuid,p_accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare link public.brethren_links;
begin
  perform pg_advisory_xact_lock(710310);
  select * into link from public.brethren_links where id=p_link and receiver_id=auth.uid() and status='pending' for update;
  if link.id is null then raise exception 'Request unavailable';end if;
  if p_accept then perform private.validate_link(link.requester_id,link.receiver_id);end if;
  update public.brethren_links set status=case when p_accept then 'accepted' else 'removed' end,updated_at=now() where id=p_link;
end; $$;
create function public.remove_link(p_other uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.brethren_links set status='removed',updated_at=now() where auth.uid() in(requester_id,receiver_id) and p_other in(requester_id,receiver_id);
end; $$;
create function public.pending_requests() returns table(link_id uuid,requester_id uuid,display_name text,church_name text) language sql stable security definer set search_path='' as $$
  select l.id,p.id,p.display_name,p.church_name from public.brethren_links l join public.profiles p on p.id=l.requester_id where l.receiver_id=auth.uid() and l.status='pending';
$$;
create function public.share_event(p_type text,p_battle text default null,p_client uuid default gen_random_uuid()) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Set up your profile first';end if;
  if not private.share_allowed(auth.uid(),p_type) then return;end if;
  insert into public.shared_events(user_id,event_type,battle_id,client_id) values(auth.uid(),p_type,p_battle,p_client) on conflict(user_id,client_id) do nothing;
end; $$;

revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.linked(uuid,uuid),private.share_allowed(uuid,text) to authenticated;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.create_profile(text,text,text),public.lookup_brethren(text),public.request_link(text),public.respond_link(uuid,boolean),public.remove_link(uuid),public.pending_requests(),public.share_event(text,text,uuid) to authenticated;
