-- The journal now uses a random key stored only wrapped: once under the PIN
-- (pin_key, with salt) and once under a recovery code the user writes down
-- (recovery_key, with recovery_salt). Either opens it; the server can open neither.
-- Entries written before this change used the PIN directly and are cleared,
-- so everyone sets a PIN again and receives a recovery code.
delete from public.journals;
delete from public.falls;
delete from public.user_vault;
alter table public.user_vault
  drop column verifier,
  add column pin_key jsonb not null,
  add column recovery_salt text not null check (char_length(recovery_salt) <= 100),
  add column recovery_key jsonb not null;
-- Changing the PIN or the recovery code rewraps the same key.
grant update (salt, pin_key, recovery_salt, recovery_key) on public.user_vault to authenticated;
