-- The one who asks can see a request waiting on the other, and withdraw it.
-- Only the name and church the other has chosen to give are shown.
create function public.sent_requests() returns table(link_id uuid,display_name text,church_name text) language sql stable security definer set search_path='' as $$
  select l.id,p.display_name,p.church_name from public.brethren_links l join public.profiles p on p.id=l.receiver_id where l.requester_id=auth.uid() and l.status='pending';
$$;
create function public.withdraw_request(p_link uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.brethren_links set status='removed',updated_at=now() where id=p_link and requester_id=auth.uid() and status='pending';
end; $$;
revoke execute on function public.sent_requests(),public.withdraw_request(uuid) from public,anon;
grant execute on function public.sent_requests(),public.withdraw_request(uuid) to authenticated;
