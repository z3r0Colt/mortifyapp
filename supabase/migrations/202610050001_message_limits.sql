-- Every message wakes someone's phone, so one person may send only so many.
-- The limits sit far above honest use: 30 an hour to any one brother or
-- sister, and 300 a day in all (a prayer request to a full circle is 8).
-- A retried send of a message already saved does not count again, so a queued
-- request is delayed by the limit, never lost or doubled.
create index messages_by_sender on public.messages(sender_id,created_at desc);
create function private.limit_messages() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.messages where sender_id=new.sender_id and receiver_id=new.receiver_id and client_id=new.client_id) then return new;end if;
  if (select count(*) from public.messages where sender_id=new.sender_id and receiver_id=new.receiver_id and created_at>now()-interval '1 hour')>=30 then
    raise exception 'You have sent many messages this hour. Please wait a little before sending more.';
  end if;
  if (select count(*) from public.messages where sender_id=new.sender_id and created_at>now()-interval '1 day')>=300 then
    raise exception 'You have sent many messages today. Please wait until tomorrow to send more.';
  end if;
  return new;
end; $$;
revoke all on function private.limit_messages() from public,anon,authenticated;
create trigger limit_messages before insert on public.messages
  for each row execute function private.limit_messages();
