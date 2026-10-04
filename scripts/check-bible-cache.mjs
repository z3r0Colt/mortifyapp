import fs from "node:fs/promises";
import assert from "node:assert/strict";
const worker = await fs.readFile("dist/sw.js", "utf8");
assert.ok(
  /(?:"url"|url):\s*["']\/?bible\/bsb\.json["']/.test(worker),
  "The production service worker must precache the full BSB JSON.",
);
const original = await fs.readFile("public/bible/bsb.json");
const built = await fs.readFile("dist/bible/bsb.json");
assert.ok(
  original.equals(built),
  "The built Bible must match the downloaded/imported text exactly.",
);
console.log(
  `Offline build check passed: bible/bsb.json (${built.length} bytes) is present in the service-worker precache.`,
);
