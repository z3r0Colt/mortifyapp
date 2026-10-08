-- Safety fixes before Mortify goes public. Nothing here deletes anyone's
-- data: it adds checks, columns and functions, and loosens one foreign key so
-- report evidence is kept.

-- 1. Brethren codes cannot be guessed.
-- A guess is counted even when it misses: lookup never raises after counting,
-- and request_link returns null on a miss instead of raising, so the count is
-- never rolled back. Every failure (no such code, the other sex, blocked)
-- looks the same. New codes are 8 characters; existing 6-character codes keep
-- working until their owner chooses a new one.
alter table public.profiles drop constraint profiles_brethren_code_check;
alter table public.profiles add constraint profiles_brethren_code_check
  check (brethren_code ~ '^([A-Z2-9]{6}|[A-Z2-9]{8})$');

create function private.new_brethren_code() returns text language plpgsql volatile set search_path='' as $$
declare bytes bytea := uuid_send(gen_random_uuid()); code text := ''; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  -- 256 is a multiple of 32, so every letter is equally likely.
  for i in 0..7 loop code := code || substr(alphabet, 1 + get_byte(bytes, i) % 32, 1); end loop;
  return code;
end; $$;
revoke all on function private.new_brethren_code() from public, anon, authenticated;

create or replace function public.create_profile(p_name text,p_sex text,p_church text default null) returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  for attempt in 1..20 loop
    begin
      insert into public.profiles(id,display_name,sex,church_name,brethren_code) values(auth.uid(),trim(p_name),p_sex,nullif(trim(p_church),''),private.new_brethren_code()) returning * into result;
      insert into public.shared_settings(user_id) values(auth.uid());
      insert into public.reminder_settings(user_id) values(auth.uid());
      return result;
    exception when unique_violation then
      if exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'A profile already exists'; end if;
    end;
  end loop;
  raise exception 'Please try creating your profile again';
end; $$;

drop function public.lookup_brethren(text);
-- Returns one value, never a set, so no client header can turn a miss into an
-- error that rolls back the count. Null means unavailable, for any reason.
create function public.lookup_brethren(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare found public.profiles;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from private.code_attempts where user_id=auth.uid() and attempted_at>now()-interval '1 hour')>=20 then return null; end if;
  insert into private.code_attempts(user_id) values(auth.uid());
  delete from private.code_attempts where attempted_at<now()-interval '1 day';
  select p.* into found from public.profiles p
    join public.profiles me on me.id=auth.uid() and me.sex=p.sex
    where p.brethren_code=upper(trim(p_code)) and p.id<>auth.uid()
      and not exists(select 1 from private.blocked_links b where (b.blocker_id=p.id and b.blocked_id=auth.uid()) or (b.blocker_id=auth.uid() and b.blocked_id=p.id));
  if found.id is null then return null; end if;
  return jsonb_build_object('display_name',found.display_name,'church_name',found.church_name);
end; $$;
revoke execute on function public.lookup_brethren(text) from public, anon;
grant execute on function public.lookup_brethren(text) to authenticated;

create or replace function public.request_link(p_code text) returns uuid language plpgsql security definer set search_path='' as $$
declare other_id uuid; result uuid;
begin
  -- The lookup counts this guess. A miss returns quietly so the count stays.
  if public.lookup_brethren(p_code) is null then return null; end if;
  select id into other_id from public.profiles where brethren_code=upper(trim(p_code));
  perform pg_advisory_xact_lock(710310);
  perform private.validate_link(auth.uid(),other_id);
  if exists(select 1 from public.brethren_links where least(requester_id,receiver_id)=least(auth.uid(),other_id) and greatest(requester_id,receiver_id)=greatest(auth.uid(),other_id) and status<>'removed') then raise exception 'A link or request already exists';end if;
  if (select count(*) from public.brethren_links where requester_id=auth.uid() and status='pending')>=10 then
    raise exception 'You have many requests waiting. Withdraw some before sending more.';
  end if;
  insert into public.brethren_links(requester_id,receiver_id) values(auth.uid(),other_id)
  on conflict(least(requester_id,receiver_id),greatest(requester_id,receiver_id)) do update set requester_id=auth.uid(),receiver_id=other_id,status='pending',created_at=now(),updated_at=now() returning id into result;
  return result;
end; $$;

-- 3. Someone who only sends requests can be blocked, and names cannot carry
-- web addresses or control characters. Existing names are left as they are.
create function public.block_request(p_link uuid) returns void language plpgsql security definer set search_path='' as $$
declare link public.brethren_links;
begin
  perform pg_advisory_xact_lock(710310);
  select * into link from public.brethren_links where id=p_link and receiver_id=auth.uid() and status='pending' for update;
  if link.id is null then raise exception 'Request unavailable';end if;
  update public.brethren_links set status='removed',updated_at=now() where id=p_link;
  insert into private.blocked_links(blocker_id,blocked_id) values(auth.uid(),link.requester_id) on conflict do nothing;
end; $$;
revoke execute on function public.block_request(uuid) from public, anon;
grant execute on function public.block_request(uuid) to authenticated;

alter table public.profiles add constraint profiles_display_name_plain
  check (display_name !~* '(https?://|www\.|[a-z0-9-]+\.[a-z]{2,})' and display_name !~ '[[:cntrl:]]') not valid;
alter table public.profiles add constraint profiles_church_name_plain
  check (church_name !~* '(https?://|www\.|[a-z0-9-]+\.[a-z]{2,})' and church_name !~ '[[:cntrl:]]') not valid;

-- 4. A report keeps its evidence, and anyone can change their code.
-- The reported message and the sender's name are copied into the report, and
-- the report stays if the reported person deletes their account. It is still
-- removed if the person who made it deletes theirs.
alter table private.message_reports
  add column message_type text,
  add column message_body text,
  add column sent_at timestamptz,
  add column reported_name text;
alter table private.message_reports alter column reported_id drop not null;
alter table private.message_reports drop constraint message_reports_reported_id_fkey;
alter table private.message_reports add constraint message_reports_reported_id_fkey
  foreign key (reported_id) references public.profiles(id) on delete set null;
update private.message_reports r
  set message_type=m.message_type, message_body=m.body, sent_at=m.created_at, reported_name=p.display_name
  from public.messages m join public.profiles p on p.id=m.sender_id
  where m.id=r.message_id and r.message_type is null;

-- 2. One report per message and ten a day, so reports cannot flood the
-- operator's inbox. The block and the unlinking still happen every time.
create or replace function public.report_message(p_message uuid) returns void language plpgsql security definer set search_path='' as $$
declare message public.messages;
begin
  perform pg_advisory_xact_lock(710310);
  select * into message from public.messages where id=p_message and receiver_id=auth.uid();
  if message.id is null then raise exception 'Received message unavailable';end if;
  if not exists(select 1 from private.message_reports where reporter_id=auth.uid() and message_id=message.id)
    and (select count(*) from private.message_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')<10 then
    insert into private.message_reports(reporter_id,reported_id,message_id,message_type,message_body,sent_at,reported_name)
      values(auth.uid(),message.sender_id,message.id,message.message_type,message.body,message.created_at,
        (select display_name from public.profiles where id=message.sender_id));
  end if;
  insert into private.blocked_links(blocker_id,blocked_id) values(auth.uid(),message.sender_id) on conflict do nothing;
  perform public.remove_link(message.sender_id);
end; $$;

create function public.rotate_brethren_code() returns text language plpgsql security definer set search_path='' as $$
declare code text;
begin
  if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Set up your profile first';end if;
  for attempt in 1..20 loop
    code := private.new_brethren_code();
    begin
      update public.profiles set brethren_code=code where id=auth.uid();
      return code;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'Please try again';
end; $$;
revoke execute on function public.rotate_brethren_code() from public, anon;
grant execute on function public.rotate_brethren_code() to authenticated;

-- 5. At most ten devices receive notifications for one person, and each
-- subscription is small. Updating a device already saved is always allowed.
create function private.limit_push_subscriptions() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.push_subscriptions where user_id=new.user_id and device_id=new.device_id) then return new;end if;
  if (select count(*) from public.push_subscriptions where user_id=new.user_id)>=10 then
    raise exception 'Notifications are on for many devices. Sign out of Mortify on a device you no longer use.';
  end if;
  return new;
end; $$;
revoke all on function private.limit_push_subscriptions() from public, anon, authenticated;
create trigger limit_push_subscriptions before insert on public.push_subscriptions
  for each row execute function private.limit_push_subscriptions();
alter table public.push_subscriptions add constraint push_subscriptions_size
  check (octet_length(subscription::text) <= 4096) not valid;
