create table private.message_reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null, created_at timestamptz not null default now()
);
create table private.blocked_links (
  blocker_id uuid references public.profiles(id) on delete cascade, blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(blocker_id,blocked_id)
);
create or replace function private.linked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.brethren_links l where l.status='accepted' and ((l.requester_id=a and l.receiver_id=b) or (l.requester_id=b and l.receiver_id=a)))
  and not exists(select 1 from private.blocked_links where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a));
$$;
create or replace function private.validate_link(a uuid,b uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from private.blocked_links where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a)) then raise exception 'This link is unavailable';end if;
  if a=b or not exists(select 1 from public.profiles p join public.profiles q on p.sex=q.sex where p.id=a and q.id=b) then raise exception 'Link only with a brother or sister of the same sex';end if;
  if (select count(*) from public.brethren_links where status='accepted' and a in(requester_id,receiver_id))>=8 or (select count(*) from public.brethren_links where status='accepted' and b in(requester_id,receiver_id))>=8 then raise exception 'A circle may have at most 8 brethren';end if;
end; $$;
create function public.report_message(p_message uuid) returns void language plpgsql security definer set search_path='' as $$
declare message public.messages;
begin
  perform pg_advisory_xact_lock(710310);
  select * into message from public.messages where id=p_message and receiver_id=auth.uid();
  if message.id is null then raise exception 'Received message unavailable';end if;
  insert into private.message_reports(reporter_id,reported_id,message_id) values(auth.uid(),message.sender_id,message.id);
  insert into private.blocked_links(blocker_id,blocked_id) values(auth.uid(),message.sender_id) on conflict do nothing;
  perform public.remove_link(message.sender_id);
end; $$;
revoke execute on function public.report_message(uuid) from public,anon;
grant execute on function public.report_message(uuid) to authenticated;
