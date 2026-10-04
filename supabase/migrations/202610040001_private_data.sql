-- Each user's own data. Every table is readable and writable only by its owner.
-- Journal and confession text arrive already encrypted with a key derived from
-- the user's PIN on the device, so the server stores ciphertext only.

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  onboarded boolean not null default false,
  trust text check (trust in ('yes','no','unsure')),
  battles text[] not null default '{}' check (cardinality(battles) <= 40),
  morning text not null default '07:00' check (morning ~ '^\d{2}:\d{2}$'),
  evening text not null default '21:00' check (evening ~ '^\d{2}:\d{2}$'),
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  protection_enabled boolean not null default false,
  protection_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Salt and a known value encrypted with the PIN-derived key. Lets a new device
-- check a PIN without the PIN or the key ever reaching the server.
create table public.user_vault (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  salt text not null check (char_length(salt) <= 100),
  verifier jsonb not null,
  created_at timestamptz not null default now()
);

create table public.flee_logs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  battle text not null check (battle ~ '^[a-z0-9-]{1,80}$'),
  answer text not null check (answer in ('stood','not-yet'))
);

create table public.journals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  battle text not null check (battle ~ '^[a-z0-9-]{1,80}$'),
  roots text[] not null default '{}' check (cardinality(roots) <= 40),
  occasions text[] not null default '{}' check (cardinality(occasions) <= 40),
  body jsonb not null check (octet_length(body::text) <= 120000)
);

create table public.falls (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  battle text not null check (battle ~ '^[a-z0-9-]{1,80}$'),
  confession jsonb not null check (octet_length(confession::text) <= 120000),
  reflection jsonb not null check (octet_length(reflection::text) <= 120000)
);

create table public.reading_history (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  key text not null check (char_length(key) <= 300),
  idx integer not null check (idx >= 0),
  day text not null check (day ~ '^\d{4}-\d{2}-\d{2}$'),
  primary key (user_id, key)
);

create index journals_owner_time on public.journals (user_id, created_at desc);
create index falls_owner_time on public.falls (user_id, created_at desc);
create index flee_logs_owner_time on public.flee_logs (user_id, created_at desc);

alter table public.user_preferences enable row level security;
alter table public.user_vault enable row level security;
alter table public.flee_logs enable row level security;
alter table public.journals enable row level security;
alter table public.falls enable row level security;
alter table public.reading_history enable row level security;

create policy preferences_own on public.user_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy vault_own on public.user_vault for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy flee_logs_own on public.flee_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journals_own on public.journals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy falls_own on public.falls for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reading_own on public.reading_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.user_preferences to authenticated;
grant select, insert, delete on public.user_vault to authenticated;
-- Entries are written once and never edited; they may be deleted.
grant select, insert, delete on public.flee_logs, public.journals, public.falls to authenticated;
grant select on public.reading_history to authenticated;

-- Moves a reading rotation forward once per local day, atomically.
create function public.rotate_reading(p_key text, p_count integer, p_day text) returns integer
language plpgsql security definer set search_path = '' as $$
declare current_row public.reading_history; next_idx integer;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_count < 1 then raise exception 'No reading is available'; end if;
  insert into public.reading_history (user_id, key, idx, day)
    values (auth.uid(), p_key, 0, p_day)
    on conflict (user_id, key) do nothing;
  select * into current_row from public.reading_history
    where user_id = auth.uid() and key = p_key for update;
  if current_row.day = p_day then return current_row.idx % p_count; end if;
  next_idx = (current_row.idx + 1) % p_count;
  update public.reading_history set idx = next_idx, day = p_day
    where user_id = auth.uid() and key = p_key;
  return next_idx;
end; $$;
revoke all on function public.rotate_reading(text, integer, text) from public;
grant execute on function public.rotate_reading(text, integer, text) to authenticated;
