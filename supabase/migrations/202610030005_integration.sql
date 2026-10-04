alter table public.profiles add column phone text check(phone ~ '^\+?[0-9 ()-]{7,25}$');
grant update(phone) on public.profiles to authenticated;
drop function public.share_event(text,text,uuid);
create function public.share_event(p_type text,p_battle text default null,p_client uuid default gen_random_uuid(),p_time timestamptz default now()) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Set up your profile first';end if;
  if not private.share_allowed(auth.uid(),p_type) then return;end if;
  insert into public.shared_events(user_id,event_type,battle_id,client_id,created_at) values(auth.uid(),p_type,p_battle,p_client,least(now(),greatest(now()-interval '30 days',p_time))) on conflict(user_id,client_id) do nothing;
end; $$;
create function public.send_circle_note(p_body text,p_client uuid default gen_random_uuid()) returns integer language plpgsql security definer set search_path='' as $$
declare peer uuid; sent integer=0;
begin
  for peer in select case when requester_id=auth.uid() then receiver_id else requester_id end from public.brethren_links where status='accepted' and auth.uid() in(requester_id,receiver_id) loop
    perform public.send_message(peer,'encouragement',p_body,null,null,p_client);sent=sent+1;
  end loop;
  return sent;
end; $$;
revoke execute on function public.share_event(text,text,uuid,timestamptz),public.send_circle_note(text,uuid) from public,anon;
grant execute on function public.share_event(text,text,uuid,timestamptz),public.send_circle_note(text,uuid) to authenticated;
