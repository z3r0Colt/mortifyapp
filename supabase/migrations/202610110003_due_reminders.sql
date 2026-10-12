-- Who is due a reminder now: anyone whose morning or evening time, in their
-- own time zone, fell within the last few minutes and has not been sent yet.
-- A window rather than the exact minute means a slow or missed run is caught
-- up by the next one; the delivery record stops a second send. Times that do
-- not exist on a spring-forward day are read in standard time, so they still
-- come, an hour later.
create function public.due_reminders(p_window interval default '15 minutes')
returns table(user_id uuid, slot text, local_date date)
language sql stable security definer set search_path = '' as $$
  with settings as (
    select r.user_id, r.timezone, x.slot, x.at
    from public.reminder_settings r
    cross join lateral (values ('morning', r.morning), ('evening', r.evening)) as x(slot, at)
    where r.enabled
      and r.timezone in (select name from pg_catalog.pg_timezone_names)
  ), candidates as (
    -- Today's time and yesterday's, so a window crossing midnight still finds
    -- the right day.
    select s.user_id, s.slot,
      (now() at time zone s.timezone)::date - b.back as local_date,
      ((((now() at time zone s.timezone)::date - b.back) + s.at) at time zone s.timezone) as due_at
    from settings s
    cross join (values (0), (1)) as b(back)
  )
  select c.user_id, c.slot, c.local_date
  from candidates c
  where now() >= c.due_at
    and now() < c.due_at + p_window
    and not exists (
      select 1 from private.reminder_deliveries d
      where d.user_id = c.user_id and d.slot = c.slot and d.local_date = c.local_date
    )
  order by c.due_at;
$$;
revoke execute on function public.due_reminders(interval) from public, anon, authenticated;
grant execute on function public.due_reminders(interval) to service_role;
