-- The PIN-locked journal key now stays on each phone. A PIN of 6 to 12 digits
-- is too short to guard a copy that anyone holding the database could test
-- offline, so the account keeps only the copy locked by the recovery code
-- (about 98 bits). Phones that already hold their copy keep working; a new
-- phone opens the journal once with the recovery code and sets its own PIN.
-- No journal, confession or vault row is removed. (Approved by the owner on
-- 2026-10-05 as the one exception to the no-data-removal rule.)
--
-- key_id names the journal key, so a phone can tell that its copy is stale
-- after the journal was cleared and begun again on another phone.
alter table public.user_vault add column key_id uuid not null default gen_random_uuid();
alter table public.user_vault drop column salt, drop column pin_key;
