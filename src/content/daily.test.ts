import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { rotate, lordsDayKey, lordsDaySchema } from "./daily";
import lordsDay from "../../public/content/lords-day.json";
it("holds a reading for the day and rotates on the following day", async () => {
  const items = ["first", "second", "third"];
  const day = new Date(2026, 9, 3, 8);
  expect(await rotate("rotation-test", items, day)).toBe("first");
  expect(await rotate("rotation-test", items, day)).toBe("first");
  expect(await rotate("rotation-test", items, new Date(2026, 9, 4, 8))).toBe(
    "second",
  );
});
it("shows Lord's Day readings on Saturday and Sunday only", () => {
  // 3 October 2026 is a Saturday.
  expect(lordsDayKey(new Date(2026, 9, 3))).toBe("saturday");
  expect(lordsDayKey(new Date(2026, 9, 4))).toBe("sunday");
  expect(lordsDayKey(new Date(2026, 9, 5))).toBeNull();
  expect(lordsDaySchema.safeParse(lordsDay).success).toBe(true);
});
