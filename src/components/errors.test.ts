import { expect, it } from "vitest";
import { plainError } from "./errors";
import { refused } from "../brethren/client";
it("puts technical failures in plain words", () => {
  expect(plainError(new TypeError("Failed to fetch"))).toMatch(
    /could not reach the internet/,
  );
  expect(
    plainError(
      new Error(
        'new row for relation "profiles" violates check constraint "profiles_phone_check"',
      ),
      "Your profile could not be saved.",
    ),
  ).toBe("Your profile could not be saved.");
  expect(
    plainError(new Error("Edge Function returned a non-2xx status code")),
  ).toMatch(/could not finish/);
  expect(plainError(new Error("Enter your PIN."))).toBe("Enter your PIN.");
});
it("tells a database refusal from a lost connection", () => {
  expect(refused(Object.assign(new Error("x"), { code: "23514" }))).toBe(true);
  expect(refused(Object.assign(new Error("x"), { code: "P0001" }))).toBe(true);
  expect(refused(new TypeError("Failed to fetch"))).toBe(false);
  expect(refused(Object.assign(new Error("x"), { code: "PGRST301" }))).toBe(
    false,
  );
});
