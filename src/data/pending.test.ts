// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { flushPending, saveEntry } from "./pending";
import { useAuth } from "../state/auth";

const uploaded = vi.hoisted(() => [] as unknown[]);
vi.mock("./remote", () => ({
  uploadEntry: async (_id: string, entry: { row: unknown }) => {
    uploaded.push(entry.row);
  },
}));
const entry = {
  table: "flee_logs" as const,
  row: {
    id: "00000000-0000-4000-8000-000000000001",
    created_at: new Date().toISOString(),
    battle: "lust",
    answer: "stood" as const,
  },
};
let online = true;
beforeEach(async () => {
  online = true;
  vi.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  uploaded.length = 0;
  await db.open();
  await db.pending.clear();
  useAuth.setState({ user: { id: "user-1" } as User, ready: true });
});
afterEach(() => vi.restoreAllMocks());

test("an entry saved online reaches the account at once", async () => {
  expect(await saveEntry(entry)).toBe(true);
  expect(uploaded).toEqual([entry.row]);
  expect(await db.pending.count()).toBe(0);
});

test("an entry saved offline waits, then uploads when the connection returns", async () => {
  online = false;
  expect(await saveEntry(entry)).toBe(false);
  expect(uploaded).toEqual([]);
  expect(await db.pending.count()).toBe(1);
  online = true;
  await flushPending();
  expect(uploaded).toEqual([entry.row]);
  expect(await db.pending.count()).toBe(0);
});
