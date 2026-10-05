import { cloud, result } from "../brethren/client";
import type { CipherText } from "../privacy/crypto";
import type {
  FallRow,
  FleeRow,
  JournalRow,
  PendingEntry,
  Preferences,
} from "./db";
// Every read and write of the user's own data in Supabase goes through here.
type PreferencesRow = {
  onboarded: boolean;
  trust: Preferences["trust"];
  battles: string[];
  morning: string;
  evening: string;
  timezone: string;
  protection_enabled: boolean;
  protection_checked_at: string | null;
};
export async function fetchPreferences(
  userId: string,
): Promise<Preferences | null> {
  const row = (await result(
    cloud()
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  )) as PreferencesRow | null;
  if (!row) return null;
  return {
    id: "main",
    onboarded: row.onboarded,
    trust: row.trust,
    battles: row.battles,
    morning: row.morning,
    evening: row.evening,
    timezone: row.timezone,
    protectionEnabled: row.protection_enabled,
    protectionCheckedAt: row.protection_checked_at
      ? Date.parse(row.protection_checked_at)
      : undefined,
  };
}
export async function savePreferences(userId: string, value: Preferences) {
  await result(
    cloud()
      .from("user_preferences")
      .upsert({
        user_id: userId,
        onboarded: value.onboarded,
        trust: value.trust,
        battles: value.battles,
        morning: value.morning,
        evening: value.evening,
        timezone: value.timezone,
        protection_enabled: value.protectionEnabled ?? false,
        protection_checked_at: value.protectionCheckedAt
          ? new Date(value.protectionCheckedAt).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }),
  );
}
/** The journal key as the account keeps it: locked by the recovery code only. */
export type Vault = {
  key_id: string;
  recovery_salt: string;
  recovery_key: CipherText;
};
export async function fetchVault(userId: string): Promise<Vault | null> {
  return (await result(
    cloud()
      .from("user_vault")
      .select("key_id,recovery_salt,recovery_key")
      .eq("user_id", userId)
      .maybeSingle(),
  )) as Vault | null;
}
export async function saveVault(userId: string, vault: Vault) {
  await result(
    cloud()
      .from("user_vault")
      .insert({ user_id: userId, ...vault }),
  );
}
export async function updateVault(userId: string, changes: Partial<Vault>) {
  await result(
    cloud().from("user_vault").update(changes).eq("user_id", userId),
  );
}
/** Removes journal entries, confessions and the locked key after a forgotten PIN. */
export async function clearPrivateEntries(userId: string) {
  for (const table of ["journals", "falls", "user_vault"])
    await result(cloud().from(table).delete().eq("user_id", userId));
}
/** Uploads an entry. Safe to repeat: an entry already saved is left alone. */
export async function uploadEntry(userId: string, entry: PendingEntry) {
  await result(
    cloud()
      .from(entry.table)
      .upsert(
        { ...entry.row, user_id: userId },
        { onConflict: "id", ignoreDuplicates: true },
      ),
  );
}
export async function journalsSince(userId: string, since: number) {
  return ((await result(
    cloud()
      .from("journals")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", new Date(since).toISOString())
      .order("created_at", { ascending: false }),
  )) ?? []) as JournalRow[];
}
export async function allEntries(userId: string) {
  const read = async <T>(table: string) =>
    ((await result(
      cloud().from(table).select("*").eq("user_id", userId).order("created_at"),
    )) ?? []) as T[];
  const [fleeLogs, journals, falls] = await Promise.all([
    read<FleeRow>("flee_logs"),
    read<JournalRow>("journals"),
    read<FallRow>("falls"),
  ]);
  return { fleeLogs, journals, falls };
}
/** Permanently removes one journal entry or confession from the account. */
export async function deleteEntry(table: "journals" | "falls", id: string) {
  await result(cloud().from(table).delete().eq("id", id));
}
export async function rotateReading(key: string, count: number, day: string) {
  return (await result(
    cloud().rpc("rotate_reading", { p_key: key, p_count: count, p_day: day }),
  )) as number;
}
