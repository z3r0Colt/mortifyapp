import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import {
  rotate,
  lordsDayKey,
  lordsDaySchema,
  halfTurn,
  questionSets,
} from "./daily";
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
it("the evening reads from the other half of the morning's list", () => {
  expect(halfTurn([1, 2, 3, 4, 5, 6])).toEqual([4, 5, 6, 1, 2, 3]);
  expect(halfTurn([1, 2, 3, 4, 5])).toEqual([3, 4, 5, 1, 2]);
});
it("shows three questions a night and comes round to every one", () => {
  const sets = questionSets(["a", "b", "c", "d", "e"]);
  expect(sets[0]).toEqual(["a", "b", "c"]);
  expect(sets[1]).toEqual(["d", "e", "a"]);
  expect(new Set(sets.slice(0, 2).flat())).toEqual(
    new Set(["a", "b", "c", "d", "e"]),
  );
  for (const set of questionSets(["a", "b", "c", "d", "e", "f"]))
    expect(new Set(set).size).toBe(3);
});
