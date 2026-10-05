-- Whether the user is a brother or a sister, asked once during onboarding so
-- every screen can speak rightly ("brethren" or "sisters") before any brethren
-- profile exists. Added only; nothing is removed.
alter table public.user_preferences add column sex text check (sex in ('brother','sister'));
