import type { Journal } from "./db";
export const heartRoots = [
  "loneliness",
  "weariness",
  "anger",
  "boredom",
  "self-pity",
  "pride",
  "unbelief",
];
export const occasionTags = [
  "morning",
  "afternoon",
  "evening",
  "night",
  "home",
  "work",
  "away from home",
  "alone",
  "using a screen",
  "resting",
];
export function weeklyPatterns(rows: Journal[], now = Date.now()) {
  const week = rows.filter(
    (row) => row.time >= now - 7 * 86400000 && row.time <= now,
  );
  const count = (key: "roots" | "occasions") => {
    const counts = new Map<string, number>();
    week.forEach((row) =>
      new Set(row[key]).forEach((tag) =>
        counts.set(tag, (counts.get(tag) ?? 0) + 1),
      ),
    );
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  };
  return {
    roots: count("roots"),
    occasions: count("occasions"),
    total: week.length,
  };
}
