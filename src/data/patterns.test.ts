import { expect, it } from "vitest";
import { weeklyPatterns } from "./patterns";
it("counts distinct tags per entry only within the past week", () => {
  const now = 1e12;
  const row = {
    battle: "lust",
    text: "",
    occasions: ["home"],
    roots: ["pride", "pride"],
  };
  const result = weeklyPatterns(
    [
      { ...row, time: now },
      { ...row, time: now - 8 * 86400000 },
      { ...row, time: now + 1 },
    ],
    now,
  );
  expect(result.roots).toEqual([["pride", 1]]);
  expect(result.total).toBe(1);
});
