import Dexie, { type EntityTable } from "dexie";
import type { CipherText } from "../privacy/crypto";
import type { Passkey } from "../privacy/passkey";
import type { OutboxItem } from "../brethren/outbox";
// The user's data lives in Supabase. This device keeps only a cache for
// opening offline, entries waiting to upload, and settings for this device.
export type Preferences = {
  id: "main";
  onboarded: boolean;
  trust: "yes" | "no" | "unsure" | null;
  /** Asked at onboarding; older accounts may not have it yet. */
  sex?: "brother" | "sister" | null;
  battles: string[];
  morning: string;
  evening: string;
  timezone: string;
  protectionCheckedAt?: number;
  protectionEnabled?: boolean;
  /** The user's own lists for the evening examination; unset means the usual. */
  heartRoots?: string[] | null;
  occasions?: string[] | null;
};
export type FleeRow = {
  id: string;
  created_at: string;
  battle: string;
  answer: "stood" | "not-yet";
};
export type JournalRow = {
  id: string;
  created_at: string;
  battle: string;
  roots: string[];
  occasions: string[];
  body: CipherText;
};
export type FallRow = {
  id: string;
  created_at: string;
  battle: string;
  confession: CipherText;
  reflection: CipherText;
};
export type PendingEntry =
  | { table: "flee_logs"; row: FleeRow }
  | { table: "journals"; row: JournalRow }
  | { table: "falls"; row: FallRow };
/** An entry saved while offline, uploaded when the connection returns. */
export type Pending = PendingEntry & {
  id: string;
  userId: string;
  time: number;
};
/** The journal key locked by this phone's PIN, plus how this device unlocks. */
export type Security = {
  id: "main";
  userId: string;
  salt: string;
  pinKey: CipherText;
  /** The account's key_id for this key; phones set up before it was added lack it. */
  keyId?: string;
  lockEnabled: boolean;
  /** Minutes away before the PIN is asked again; 0 locks at once. Default 1. */
  lockAfter?: number;
  deviceKey?: CryptoKey;
  biometricEnabled?: boolean;
  /** On the web, the journal key locked by a passkey's fingerprint or face check. */
  passkey?: Passkey;
  /** When the recovery code was last confirmed, and any "remind me later". */
  codeCheckedAt?: number;
  codeCheckSnoozedUntil?: number;
  /** Wrong PINs in a row on this phone, and when the next try is allowed. */
  failedPins?: number;
  lockedUntil?: number;
  /** How many digits the PIN has, so the lock screen opens on the last one. */
  pinLength?: number;
};
export type ReadingHistory = { key: string; last: number; index: number };
export const db = new Dexie("mortify") as Dexie & {
  preferences: EntityTable<Preferences & { userId?: string }, "id">;
  readingHistory: EntityTable<ReadingHistory, "key">;
  security: EntityTable<Security, "id">;
  cloudKv: EntityTable<{ key: string; value: string }, "key">;
  outbox: EntityTable<OutboxItem, "id">;
  pending: EntityTable<Pending, "id">;
};
db.version(1).stores({
  preferences: "id",
  fleeLogs: "++id,time,battle",
  journals: "++id,time,battle",
  falls: "++id,time,battle",
  readingHistory: "key,last",
});
db.version(2).stores({ security: "id" });
db.version(3).stores({ cloudKv: "key" });
db.version(4).stores({ outbox: "id,userId,time" });
// Entries moved to Supabase. Earlier on-device entries and PIN are dropped.
db.version(5)
  .stores({
    fleeLogs: null,
    journals: null,
    falls: null,
    pending: "id,userId,time",
  })
  .upgrade((tx) => tx.table("security").clear());
export const defaultPreferences: Preferences = {
  id: "main",
  onboarded: false,
  trust: null,
  battles: [],
  morning: "07:00",
  evening: "21:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
