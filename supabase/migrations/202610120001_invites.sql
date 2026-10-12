-- Invites: a one-time link a person makes for someone they know. Making it is
-- the inviter's yes, so when the one invited confirms, the two are linked at
-- once. Only a hash of the link is kept; it works once and for seven days.
-- Added only; nothing is removed.
create table private.brethren_invites (
  token_hash bytea primary key,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz
);
create index brethren_invites_inviter on private.brethren_invites(inviter_id, created_at);

create function private.invite_hash(p_token text) returns bytea
language sql immutable set search_path = '' as $$
  select pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.lower(pg_catalog.btrim(p_token)), 'UTF8'));
$$;

-- An invite still open for this caller: not used, not expired, not their
-- own, and not blocked either way. Null otherwise.
create function private.open_invite(p_token text) returns private.brethren_invites
language sql stable security definer set search_path = '' as $$
  select i.* from private.brethren_invites i
  where i.token_hash = private.invite_hash(p_token)
    and i.used_at is null and i.expires_at > now()
    and i.inviter_id <> auth.uid()
    and not exists (
      select 1 from private.blocked_links b
      where (b.blocker_id = i.inviter_id and b.blocked_id = auth.uid())
         or (b.blocker_id = auth.uid() and b.blocked_id = i.inviter_id)
    );
$$;

create function public.create_invite() returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Set up your profile first';
  end if;
  perform pg_advisory_xact_lock(hashtext('invite' || auth.uid()::text));
  if (select count(*) from public.brethren_links where status = 'accepted' and auth.uid() in (requester_id, receiver_id)) >= 8 then
    raise exception 'A circle may have at most 8 brethren';
  end if;
  if (select count(*) from private.brethren_invites where inviter_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You have made many invites today. Please try again tomorrow.';
  end if;
  token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into private.brethren_invites(token_hash, inviter_id) values (private.invite_hash(token), auth.uid());
  return token;
end; $$;

-- Who made the invite, for the one invited to see before confirming. Only for
-- someone of the same sex, read from the profile or, before there is one,
-- from the answer given in onboarding. Null means unavailable, for any reason.
create function public.invite_details(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare invite private.brethren_invites; inviter public.profiles; my_sex text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  invite := private.open_invite(p_token);
  if invite.inviter_id is null then return null; end if;
  select * into inviter from public.profiles where id = invite.inviter_id;
  select coalesce(
    (select sex from public.profiles where id = auth.uid()),
    (select sex from public.user_preferences where user_id = auth.uid())
  ) into my_sex;
  if my_sex is distinct from inviter.sex then return null; end if;
  return jsonb_build_object('display_name', inviter.display_name, 'church_name', inviter.church_name);
end; $$;

create function public.accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invite private.brethren_invites; result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Set up your profile first';
  end if;
  perform pg_advisory_xact_lock(710310);
  invite := private.open_invite(p_token);
  if invite.inviter_id is null then raise exception 'This invite is unavailable'; end if;
  -- Already linked: the invite is simply used.
  if not private.linked(invite.inviter_id, auth.uid()) then
    perform private.validate_link(invite.inviter_id, auth.uid());
  end if;
  insert into public.brethren_links(requester_id, receiver_id, status)
  values (invite.inviter_id, auth.uid(), 'accepted')
  on conflict (least(requester_id, receiver_id), greatest(requester_id, receiver_id))
  do update set status = 'accepted', updated_at = now()
  returning id into result;
  update private.brethren_invites set used_by = auth.uid(), used_at = now()
  where token_hash = invite.token_hash;
  return result;
end; $$;

revoke execute on function public.create_invite() from public, anon;
revoke execute on function public.invite_details(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.create_invite() to authenticated;
grant execute on function public.invite_details(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
revoke execute on function private.open_invite(text) from public;
revoke execute on function private.invite_hash(text) from public;
