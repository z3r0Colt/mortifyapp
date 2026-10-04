import Dexie, { type EntityTable } from "dexie";
import type { CipherText } from "../privacy/crypto";
import type { OutboxItem } from "../brethren/outbox";
export type Preferences = {
  id: "main";
  onboarded: boolean;
  trust: "yes" | "no" | "unsure" | null;
  battles: string[];
  morning: string;
  evening: string;
  timezone: string;
  protectionCheckedAt?: number;
  protectionEnabled?: boolean;
};
export type FleeLog = {
  id?: number;
  time: number;
  battle: string;
  answer: "stood" | "not-yet";
};
export type Journal = {
  id?: number;
  time: number;
  battle: string;
  roots: string[];
  occasions: string[];
  text: string | CipherText;
};
export type FallLog = {
  id?: number;
  time: number;
  battle: string;
  confession: string | CipherText;
  reflection: string | CipherText;
};
export type Security = {
  id: "main";
  salt: string;
  verifier: CipherText;
  lockEnabled: boolean;
  deviceKey?: CryptoKey;
  biometricEnabled?: boolean;
};
export type ReadingHistory = { key: string; last: number; index: number };
export const db = new Dexie("mortify") as Dexie & {
  preferences: EntityTable<Preferences, "id">;
  fleeLogs: EntityTable<FleeLog, "id">;
  journals: EntityTable<Journal, "id">;
  falls: EntityTable<FallLog, "id">;
  readingHistory: EntityTable<ReadingHistory, "key">;
  security: EntityTable<Security, "id">;
  cloudKv: EntityTable<{ key: string; value: string }, "key">;
  outbox: EntityTable<OutboxItem, "id">;
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
export const defaultPreferences: Preferences = {
  id: "main",
  onboarded: false,
  trust: null,
  battles: [],
  morning: "07:00",
  evening: "21:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
