-- Reminders and notifications belong to the account, not to the brethren
-- profile: someone who has not joined a circle can still turn them on. Each
-- row already belongs to an account, so nothing is changed or removed; only
-- what each row points to.
alter table public.push_subscriptions drop constraint push_subscriptions_user_id_fkey;
alter table public.push_subscriptions add constraint push_subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.reminder_settings drop constraint reminder_settings_user_id_fkey;
alter table public.reminder_settings add constraint reminder_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table private.reminder_deliveries drop constraint reminder_deliveries_user_id_fkey;
alter table private.reminder_deliveries add constraint reminder_deliveries_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Someone who turned on reminders before joining a circle already has
-- reminder settings; keep them when the profile is made.
create or replace function public.create_profile(p_name text,p_sex text,p_church text default null) returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  for attempt in 1..20 loop
    begin
      insert into public.profiles(id,display_name,sex,church_name,brethren_code) values(auth.uid(),trim(p_name),p_sex,nullif(trim(p_church),''),private.new_brethren_code()) returning * into result;
      insert into public.shared_settings(user_id) values(auth.uid());
      insert into public.reminder_settings(user_id) values(auth.uid()) on conflict (user_id) do nothing;
      return result;
    exception when unique_violation then
      if exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'A profile already exists'; end if;
    end;
  end loop;
  raise exception 'Please try creating your profile again';
end; $$;
