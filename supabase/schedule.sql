-- Run after configuring Vault secrets, pg_cron and pg_net in the dashboard.
-- Vault names: mortify_reminder_url (complete /functions/v1/reminders URL)
-- and mortify_reminder_secret (same value as REMINDER_SECRET).
select cron.schedule('mortify-reminders','* * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='mortify_reminder_url'),
    headers := jsonb_build_object('Content-Type','application/json','x-mortify-secret',(select decrypted_secret from vault.decrypted_secrets where name='mortify_reminder_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 10000
  );
$$);
