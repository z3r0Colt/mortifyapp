-- Each person may keep their own lists of heart roots and occasions of sin
-- for the evening examination. Null means the usual lists.
create function private.tags_ok(tags text[]) returns boolean language sql immutable set search_path='' as $$
  select tags is null or (
    cardinality(tags) <= 30
    and not exists(select 1 from unnest(tags) t where char_length(trim(t)) not between 1 and 40 or t ~ '[[:cntrl:]]')
  );
$$;
grant execute on function private.tags_ok(text[]) to authenticated;
alter table public.user_preferences
  add column heart_roots text[] check (private.tags_ok(heart_roots)),
  add column occasions text[] check (private.tags_ok(occasions));
