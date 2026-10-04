alter table public.messages add column battle_id text check(battle_id ~ '^[a-z0-9-]{1,80}$');
alter table public.messages add column answered_at timestamptz;
alter table public.messages add column client_id uuid not null default gen_random_uuid();
create unique index message_idempotency on public.messages(sender_id,receiver_id,client_id);
create unique index one_praying_reply on public.messages(sender_id,parent_message_id) where message_type='praying' and parent_message_id is not null;
alter table public.profiles add column discreet_notifications boolean not null default false;
grant update(discreet_notifications) on public.profiles to authenticated;

create or replace function private.sharing_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not new.share_battles then
    update public.shared_events set battle_id=null where user_id=new.user_id;
    update public.messages set battle_id=null where sender_id=new.user_id;
  end if;
  return new;
end; $$;
create function public.send_message(p_receiver uuid,p_type text,p_body text default null,p_parent uuid default null,p_battle text default null,p_client uuid default gen_random_uuid()) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; parent public.messages; clean text; battle text;
begin
  if not private.linked(auth.uid(),p_receiver) then raise exception 'An accepted link is required';end if;
  if p_type not in ('pray_for_me','praying','checking_in','reply','encouragement') then raise exception 'Invalid message type';end if;
  if p_parent is not null then
    select * into parent from public.messages where id=p_parent;
    if parent.id is null or not ((parent.sender_id=auth.uid() and parent.receiver_id=p_receiver) or (parent.receiver_id=auth.uid() and parent.sender_id=p_receiver)) then raise exception 'Reply must stay in the same conversation';end if;
    if p_type='praying' and (parent.message_type<>'pray_for_me' or parent.receiver_id<>auth.uid()) then raise exception 'Reply to a received prayer request';end if;
    if p_type='praying' then select id into result from public.messages where sender_id=auth.uid() and parent_message_id=p_parent and message_type='praying';if result is not null then return result;end if;end if;
  elsif p_type='reply' then raise exception 'A reply needs a parent message';
  end if;
  if p_type in ('reply','encouragement') then
    if char_length(coalesce(p_body,''))>500 then raise exception 'Messages may have at most 500 characters';end if;
    clean=trim(regexp_replace(coalesce(p_body,''),'(https?://[^[:space:]]+|www\.[^[:space:]]+|[a-z0-9-]+\.[a-z]{2,}[^[:space:]]*)','','gi'));
    if clean='' then raise exception 'Write a short plain text message without links';end if;
  else clean=null;
  end if;
  if p_type='pray_for_me' and (select share_battles from public.shared_settings where user_id=auth.uid()) then battle=p_battle;end if;
  insert into public.messages(sender_id,receiver_id,message_type,body,parent_message_id,battle_id,client_id) values(auth.uid(),p_receiver,p_type,clean,p_parent,battle,p_client)
  on conflict(sender_id,receiver_id,client_id) do update set client_id=excluded.client_id returning id into result;
  return result;
end; $$;
create function public.send_circle(p_battle text default null,p_client uuid default gen_random_uuid()) returns integer language plpgsql security definer set search_path='' as $$
declare peer uuid; sent integer=0;
begin
  for peer in select case when requester_id=auth.uid() then receiver_id else requester_id end from public.brethren_links where status='accepted' and auth.uid() in(requester_id,receiver_id) loop
    perform public.send_message(peer,'pray_for_me',null,null,p_battle,p_client);sent=sent+1;
  end loop;
  return sent;
end; $$;
create function public.mark_message_read(p_message uuid) returns void language sql security definer set search_path='' as $$
  update public.messages set read=true where id=p_message and receiver_id=auth.uid() and private.linked(sender_id,receiver_id);
$$;
create function public.answer_prayer(p_client uuid) returns void language sql security definer set search_path='' as $$
  update public.messages set answered_at=now() where client_id=p_client and sender_id=auth.uid() and message_type='pray_for_me';
$$;
revoke execute on function public.send_message(uuid,text,text,uuid,text,uuid),public.send_circle(text,uuid),public.mark_message_read(uuid),public.answer_prayer(uuid) from public,anon;
grant execute on function public.send_message(uuid,text,text,uuid,text,uuid),public.send_circle(text,uuid),public.mark_message_read(uuid),public.answer_prayer(uuid) to authenticated;
