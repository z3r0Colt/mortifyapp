create table public.shared_battles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  battle_ids text[] not null default '{}' check(cardinality(battle_ids)<=50 and length(array_to_string(battle_ids,','))<=4000)
);
alter table public.shared_battles enable row level security;
create policy battles_read on public.shared_battles for select to authenticated using(user_id=auth.uid() or (private.linked(auth.uid(),user_id) and exists(select 1 from public.shared_settings where user_id=shared_battles.user_id and share_battles)));
create policy battles_insert on public.shared_battles for insert to authenticated with check(user_id=auth.uid());
create policy battles_update on public.shared_battles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.shared_battles from anon,authenticated;
grant select,insert,update on public.shared_battles to authenticated;
