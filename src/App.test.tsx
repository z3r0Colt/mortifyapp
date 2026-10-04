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
import { db, defaultPreferences } from "./data/db";
import { usePreferences } from "./state/preferences";
import { useApp } from "./state/app";
import { usePrivacy } from "./state/privacy";
import { decryptText } from "./privacy/crypto";

beforeEach(async () => {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => ({
      ok: true,
      json: async () => JSON.parse(await readFile(`public${input}`, "utf8")),
    })),
  );
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
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

test("first launch cannot skip trust/battle choices", async () => {
  window.history.replaceState({}, "", "/onboarding/times");
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Begin" }));
  await screen.findByRole("heading", {
    name: "Are you trusting in Christ alone?",
  });
  expect((await db.preferences.get("main"))?.onboarded).not.toBe(true);
});

test.each(["no", "unsure"] as const)(
  "the %s trust answer may continue after the gospel path",
  async (trust) => {
    await db.preferences.put({
      ...defaultPreferences,
      trust,
      battles: ["lust"],
    });
    window.history.replaceState({}, "", "/onboarding/times");
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Begin" }));
    await screen.findByRole("heading", { name: "Keep your journal private" });
    expect((await db.preferences.get("main"))?.onboarded).toBe(true);
  },
);

test("private examination is encrypted, locked, and requires the correct PIN", async () => {
  await db.preferences.put({
    ...defaultPreferences,
    onboarded: true,
    trust: "yes",
    battles: ["lust"],
  });
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
  const saved = (await db.journals.toArray())[0];
  expect(typeof saved.text).toBe("object");
  expect(JSON.stringify(saved)).not.toContain("PRIVATE TEST TEXT");
  expect(
    await decryptText(
      usePrivacy.getState().key!,
      saved.text as Exclude<typeof saved.text, string>,
    ),
  ).toBe("PRIVATE TEST TEXT");
  act(() => usePrivacy.getState().lock());
  await waitFor(() => expect(usePrivacy.getState().key).toBeNull());
  await expect(usePrivacy.getState().unlock("999999")).rejects.toThrow();
  expect(usePrivacy.getState().key).toBeNull();
});

test("reading a chapter during a fall preserves the unfinished private confession and flow", async () => {
  await db.preferences.put({
    ...defaultPreferences,
    onboarded: true,
    trust: "yes",
    battles: ["lust"],
  });
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
  await waitFor(async () => expect(await db.falls.count()).toBe(1));
  const saved = (await db.falls.toArray())[0];
  expect(
    await decryptText(
      usePrivacy.getState().key!,
      saved.confession as Exclude<typeof saved.confession, string>,
    ),
  ).toBe("UNFINISHED PRIVATE CONFESSION");
});
