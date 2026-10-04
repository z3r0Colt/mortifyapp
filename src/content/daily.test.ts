import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { rotate } from "./daily";
it("holds a reading for the day and rotates on the following day", async () => {
  const items = ["first", "second", "third"];
  const day = new Date(2026, 9, 3, 8);
  expect(await rotate("rotation-test", items, day)).toBe("first");
  expect(await rotate("rotation-test", items, day)).toBe("first");
  expect(await rotate("rotation-test", items, new Date(2026, 9, 4, 8))).toBe(
    "second",
  );
});
