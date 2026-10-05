-- Notification plumbing. Run once in the SQL editor after the migrations and
-- after the Vault holds these five secrets (never commit their values):
--   mortify_reminder_url    https://<project>.supabase.co/functions/v1/reminders
--   mortify_reminder_secret same value as the REMINDER_SECRET function secret
--   mortify_push_url        https://<project>.supabase.co/functions/v1/push-message
--   mortify_webhook_secret  same value as the MESSAGE_WEBHOOK_SECRET function secret
--   mortify_report_url      https://<project>.supabase.co/functions/v1/report-alert
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

-- When a message is reported, tell the report-alert function so the operator
-- is emailed. Needs the Vault secret mortify_report_url (the full
-- /functions/v1/report-alert URL); it reuses mortify_webhook_secret.
create or replace function private.notify_new_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare report_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'mortify_report_url');
begin
  -- A missing alert setup must never stop the report itself.
  if report_url is not null then
    perform net.http_post(
      url := report_url,
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
revoke all on function private.notify_new_report() from public, anon, authenticated;
drop trigger if exists mortify_report_alert on private.message_reports;
create trigger mortify_report_alert after insert on private.message_reports
  for each row execute function private.notify_new_report();

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
