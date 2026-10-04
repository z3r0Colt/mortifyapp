-- Supabase grants every new public table to anon and authenticated by default.
-- Remove those defaults so only the privileges below apply, as the earlier
-- migrations do. Row-level security already limited each user to their own rows;
-- this also keeps saved entries write-once and keeps signed-out visitors out.
revoke all on public.user_preferences, public.user_vault, public.flee_logs,
  public.journals, public.falls, public.reading_history from anon, authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant select, insert, delete on public.user_vault to authenticated;
grant select, insert, delete on public.flee_logs, public.journals, public.falls to authenticated;
grant select on public.reading_history to authenticated;
revoke execute on function public.rotate_reading(text, integer, text) from public, anon;
grant execute on function public.rotate_reading(text, integer, text) to authenticated;
