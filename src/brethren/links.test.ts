// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import {
  captureLink,
  clearInvite,
  codeUrl,
  inviteUrl,
  pendingCode,
  pendingInvite,
} from "./links";
const token = "ab".repeat(32);
afterEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
it("keeps an invite from the address and moves on to the circle", () => {
  window.history.replaceState(null, "", `/invite#${token.toUpperCase()}`);
  captureLink();
  expect(pendingInvite()).toBe(token);
  expect(window.location.pathname).toBe("/brethren");
  expect(window.location.hash).toBe("");
  clearInvite();
  expect(pendingInvite()).toBeNull();
});
it("keeps a shared code and opens Add by code", () => {
  window.history.replaceState(null, "", "/add#abcd2345");
  captureLink();
  expect(pendingCode()).toBe("ABCD2345");
  expect(window.location.pathname).toBe("/brethren/add");
});
it("ignores what is not an invite or a code", () => {
  window.history.replaceState(null, "", "/invite#not-a-token");
  captureLink();
  window.history.replaceState(null, "", "/add#O0I1");
  captureLink();
  window.history.replaceState(null, "", `/journal#${token}`);
  captureLink();
  expect(pendingInvite()).toBeNull();
  expect(pendingCode()).toBeNull();
  expect(window.location.pathname).toBe("/journal");
});
it("forgets an invite after a week, as the invite itself expires", () => {
  localStorage.setItem(
    "mortify-invite",
    JSON.stringify({ value: token, at: Date.now() - 8 * 24 * 60 * 60 * 1000 }),
  );
  expect(pendingInvite()).toBeNull();
  expect(localStorage.getItem("mortify-invite")).toBeNull();
});
it("builds links that carry the token after the #", () => {
  expect(inviteUrl(token)).toBe(`${location.origin}/invite#${token}`);
  expect(codeUrl("ABCD2345")).toBe(`${location.origin}/add#ABCD2345`);
});
