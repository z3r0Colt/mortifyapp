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
import { decryptText, encryptText, type CipherText } from "./privacy/crypto";
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
    account.vault.set(id, structuredClone(vault));
  },
  updateVault: async (id: string, changes: object) => {
    account.vault.set(id, { ...(account.vault.get(id) as object), ...changes });
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
  await waitFor(() =>
    expect(window.location.pathname).toBe("/onboarding/welcome"),
  );
  fireEvent.click(await screen.findByRole("link", { name: "Begin" }));
  await screen.findByRole("heading", { name: "Christ is our hope" });
  fireEvent.click(await screen.findByRole("link", { name: "Continue" }));
  await screen.findByRole("heading", { name: "Your account" });
});

test("a returning visitor can go from the welcome straight to sign-in", async () => {
  render(<App />);
  fireEvent.click(
    await screen.findByRole("link", { name: "I already have an account" }),
  );
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

test("a forgotten PIN is replaced with the recovery code and the journal is kept", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust"] });
  await usePrivacy.getState().setup("123456");
  const code = usePrivacy.getState().recoveryCode!;
  expect(JSON.stringify([...account.vault.values()])).not.toContain(code);
  account.rows.journals.push({
    body: await encryptText(usePrivacy.getState().key!, "KEEP ME"),
  });
  render(<App />);
  fireEvent.click(
    await screen.findByRole("button", { name: "I have forgotten my PIN" }),
  );
  fireEvent.change(screen.getByLabelText("Recovery code"), {
    target: { value: code.toLowerCase().replace(/-/g, " ") },
  });
  fireEvent.change(screen.getByLabelText("New PIN"), {
    target: { value: "654321" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new PIN"), {
    target: { value: "654321" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set new PIN" }));
  await screen.findByRole("heading", { name: "Watch and pray" });
  expect(
    await decryptText(
      usePrivacy.getState().key!,
      account.rows.journals[0].body as CipherText,
    ),
  ).toBe("KEEP ME");
  await expect(usePrivacy.getState().unlock("123456")).rejects.toThrow();
  await usePrivacy.getState().unlock("654321");
});

test("the PIN box is not a password field, so password managers leave it alone", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust"] });
  await usePrivacy.getState().setup("123456");
  render(<App />);
  const pin = (await screen.findByLabelText("PIN")) as HTMLInputElement;
  expect(pin.type).toBe("text");
  expect(pin.autocomplete).toBe("off");
  expect(pin.getAttribute("data-1p-ignore")).not.toBeNull();
});

test("with several battles, Flee asks which temptation before the steps", async () => {
  signedIn({ onboarded: true, trust: "yes", battles: ["lust", "pride"] });
  await usePrivacy.getState().setup("123456");
  window.history.replaceState({}, "", "/flee");
  render(<App />);
  fireEvent.change(await screen.findByLabelText("PIN"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open Mortify" }));
  await screen.findByRole("heading", { name: "What are you fleeing?" });
  fireEvent.click(screen.getByRole("button", { name: "Pride" }));
  await screen.findByRole("heading", { name: "Attend to the Word" });
  expect(screen.getByText("Pride")).toBeTruthy();
});
