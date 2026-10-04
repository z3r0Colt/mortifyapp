// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "./App";
import { db, defaultPreferences, type Preferences } from "./data/db";
import { usePreferences } from "./state/preferences";
import { useApp } from "./state/app";
import { usePrivacy } from "./state/privacy";
import { useAuth } from "./state/auth";
import { decryptText, type CipherText } from "./privacy/crypto";
import type { User } from "@supabase/supabase-js";

// A stand-in for the account in Supabase, kept in memory.
const account = vi.hoisted(() => ({
  prefs: new Map<string, unknown>(),
  vault: new Map<string, unknown>(),
  rows: {
    journals: [] as Record<string, unknown>[],
    falls: [] as Record<string, unknown>[],
    flee_logs: [] as Record<string, unknown>[],
  },
}));
vi.mock("./data/remote", () => ({
  fetchPreferences: async (id: string) => account.prefs.get(id) ?? null,
  savePreferences: async (id: string, value: unknown) => {
    account.prefs.set(id, structuredClone(value));
  },
  fetchVault: async (id: string) => account.vault.get(id) ?? null,
  saveVault: async (id: string, vault: unknown) => {
    account.vault.set(id, vault);
  },
  clearPrivateEntries: async (id: string) => {
    account.vault.delete(id);
    account.rows.journals = [];
    account.rows.falls = [];
  },
  uploadEntry: async (
    _id: string,
    entry: { table: keyof typeof account.rows; row: Record<string, unknown> },
  ) => {
    account.rows[entry.table].push(entry.row);
  },
  journalsSince: async () => account.rows.journals,
  allEntries: async () => ({
    fleeLogs: account.rows.flee_logs,
    journals: account.rows.journals,
    falls: account.rows.falls,
  }),
  rotateReading: async () => 0,
}));

const me = { id: "user-1", email: "test@example.com" } as User;
const signedIn = (prefs: Partial<Preferences> = {}) => {
  account.prefs.set(me.id, { ...defaultPreferences, ...prefs });
  useAuth.setState({ user: me, ready: true });
};

beforeEach(async () => {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => ({
      ok: true,
      json: async () => JSON.parse(await readFile(`public${input}`, "utf8")),
    })),
  );
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
  account.prefs.clear();
  account.vault.clear();
  account.rows.journals = [];
  account.rows.falls = [];
  account.rows.flee_logs = [];
  useAuth.setState({ user: null, ready: true });
  usePreferences.setState({
    value: { ...defaultPreferences, battles: [] },
    loaded: false,
    error: "",
  });
  useApp.setState({ packs: [], ready: false, error: null });
  usePrivacy.setState({ loaded: false, security: null, key: null, error: "" });
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const savedPrefs = () => account.prefs.get(me.id) as Preferences | undefined;

test("signed-out visitors start at the welcome and cannot reach Home", async () => {
  window.history.replaceState({}, "", "/examine");
  render(<App />);
  await screen.findByText("Welcome");
  expect(window.location.pathname).toBe("/onboarding/gospel");
  fireEvent.click(await screen.findByRole("link", { name: "Continue" }));
  await screen.findByRole("heading", { name: "Your account" });
});

test("first launch cannot skip trust/battle choices", async () => {
  signedIn();
  window.history.replaceState({}, "", "/onboarding/times");
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Begin" }));
  await screen.findByRole("heading", {
    name: "Are you trusting in Christ alone?",
  });
  expect(savedPrefs()?.onboarded).not.toBe(true);
});

test.each(["no", "unsure"] as const)(
  "the %s trust answer may continue after the gospel path",
  async (trust) => {
    signedIn({ trust, battles: ["lust"] });
    window.history.replaceState({}, "", "/onboarding/times");
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Begin" }));
    await screen.findByRole("heading", { name: "Keep your journal private" });
    expect(savedPrefs()?.onboarded).toBe(true);
  },
);

test("private examination is encrypted before it reaches the account", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust"] });
  await usePrivacy.getState().setup("123456");
  window.history.replaceState({}, "", "/examine");
  render(<App />);
  // Opening an installed app always loads a locked state.
  const pin = await screen.findByLabelText("PIN");
  fireEvent.change(pin, { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Open Mortify" }));
  const input = await screen.findByLabelText("Private examination");
  fireEvent.change(input, { target: { value: "PRIVATE TEST TEXT" } });
  fireEvent.click(screen.getByRole("button", { name: "Save examination" }));
  await screen.findByText(/Your examination is saved/);
  const saved = account.rows.journals[0];
  expect(JSON.stringify(saved)).not.toContain("PRIVATE TEST TEXT");
  expect(
    await decryptText(usePrivacy.getState().key!, saved.body as CipherText),
  ).toBe("PRIVATE TEST TEXT");
  expect(JSON.stringify([...account.vault.values()])).not.toContain("123456");
  act(() => usePrivacy.getState().lock());
  await waitFor(() => expect(usePrivacy.getState().key).toBeNull());
  await expect(usePrivacy.getState().unlock("999999")).rejects.toThrow();
  expect(usePrivacy.getState().key).toBeNull();
});

test("a new phone opens the journal with the same PIN", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust"] });
  await usePrivacy.getState().setup("123456");
  // Nothing on this phone yet: only the account knows the PIN check.
  await db.security.clear();
  usePrivacy.setState({ loaded: false, security: null, key: null });
  render(<App />);
  fireEvent.change(await screen.findByLabelText("PIN"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open Mortify" }));
  await screen.findByRole("heading", { name: "Watch and pray" });
});

test("reading a chapter during a fall preserves the unfinished private confession and flow", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust"] });
  await usePrivacy.getState().setup("123456");
  window.history.replaceState({}, "", "/fall");
  render(<App />);
  fireEvent.change(await screen.findByLabelText("PIN"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open Mortify" }));
  fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Private confession (optional)"), {
    target: { value: "UNFINISHED PRIVATE CONFESSION" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText("BSB")).toBeTruthy();
  fireEvent.click(
    await screen.findByRole("link", { name: "Read the chapter" }),
  );
  await screen.findByRole("heading", { name: "James 5" });
  expect(
    screen.queryByRole("heading", { name: "Seek the care of brethren" }),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Return to the reading" }),
  );
  await screen.findByRole("heading", { name: "Seek the care of brethren" });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Return home" }));
  await waitFor(() => expect(account.rows.falls.length).toBe(1));
  expect(
    await decryptText(
      usePrivacy.getState().key!,
      account.rows.falls[0].confession as CipherText,
    ),
  ).toBe("UNFINISHED PRIVATE CONFESSION");
});
