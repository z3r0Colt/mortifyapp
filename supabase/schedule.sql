-- Notification plumbing. Run once in the SQL editor after the migrations and
-- after the Vault holds these four secrets (never commit their values):
--   mortify_reminder_url    https://<project>.supabase.co/functions/v1/reminders
--   mortify_reminder_secret same value as the REMINDER_SECRET function secret
--   mortify_push_url        https://<project>.supabase.co/functions/v1/push-message
--   mortify_webhook_secret  same value as the MESSAGE_WEBHOOK_SECRET function secret
-- Safe to run again.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Every minute, ask the reminders function to send any morning or evening
-- reminders that are due in each user's own time zone.
select cron.schedule('mortify-reminders', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_reminder_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-mortify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_reminder_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
$$);

-- When a message is written, tell the push function its id. The function
-- reads the message itself and checks the link before notifying anyone.
create or replace function private.notify_new_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_push_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-mortify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_webhook_secret')
    ),
    body := jsonb_build_object('type', 'INSERT', 'record', jsonb_build_object('id', new.id)),
    timeout_milliseconds := 5000
  );
  return new;
end; $$;
revoke all on function private.notify_new_message() from public, anon, authenticated;
drop trigger if exists mortify_push_message on public.messages;
create trigger mortify_push_message after insert on public.messages
  for each row execute function private.notify_new_message();

-- Deliver new messages live to open apps.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
