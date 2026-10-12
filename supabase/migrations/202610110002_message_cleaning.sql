-- A note that ends in "www." or "https://" passed the cleaning below but not
-- the table's rule against links, so it could never be sent, and it held up
-- everything queued behind it. Clean those too.
create or replace function public.send_message(p_receiver uuid,p_type text,p_body text default null,p_parent uuid default null,p_battle text default null,p_client uuid default gen_random_uuid()) returns uuid language plpgsql security definer set search_path='' as $$
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
    clean=trim(regexp_replace(coalesce(p_body,''),'(https?://[^[:space:]]*|www\.[^[:space:]]*|[a-z0-9-]+\.[a-z]{2,}[^[:space:]]*)','','gi'));
    if clean='' then raise exception 'Write a short plain text message without links';end if;
  else clean=null;
  end if;
  if p_type='pray_for_me' and (select share_battles from public.shared_settings where user_id=auth.uid()) then battle=p_battle;end if;
  insert into public.messages(sender_id,receiver_id,message_type,body,parent_message_id,battle_id,client_id) values(auth.uid(),p_receiver,p_type,clean,p_parent,battle,p_client)
  on conflict(sender_id,receiver_id,client_id) do update set client_id=excluded.client_id returning id into result;
  return result;
end; $$;

-- Telling the push function about a new message must never stop the message
-- itself: a missing address or a network fault is ignored, as it already is
-- for reports. (Also in schedule.sql.)
create or replace function private.notify_new_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare push_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_push_url');
begin
  if push_url is not null then
    perform net.http_post(
      url := push_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-mortify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_webhook_secret')
      ),
      body := jsonb_build_object('type', 'INSERT', 'record', jsonb_build_object('id', new.id)),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
exception when others then
  return new;
end; $$;
revoke all on function private.notify_new_message() from public, anon, authenticated;
