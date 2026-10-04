create function public.claim_reminder(p_user uuid,p_slot text,p_date date) returns boolean language plpgsql security definer set search_path='' as $$
begin
  insert into private.reminder_deliveries(user_id,slot,local_date) values(p_user,p_slot,p_date) on conflict do nothing;
  return found;
end; $$;
create function public.release_reminder(p_user uuid,p_slot text,p_date date) returns void language sql security definer set search_path='' as $$
  delete from private.reminder_deliveries where user_id=p_user and slot=p_slot and local_date=p_date;
$$;
revoke execute on function public.claim_reminder(uuid,text,date),public.release_reminder(uuid,text,date) from public,anon,authenticated;
grant execute on function public.claim_reminder(uuid,text,date),public.release_reminder(uuid,text,date) to service_role;
