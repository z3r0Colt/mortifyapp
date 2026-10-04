import fs from "node:fs/promises";
import path from "node:path";
const repairs = [
  ["\u00e2\u20ac\u2122", "\u2019"],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u201c", "\u2013"],
  ["\u00e2\u20ac\u00a6", "\u2026"],
  ["\u00c2\u00b7", "\u00b7"],
];
async function visit(dir) {
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await visit(file);
    else if (/\.(tsx?|js|css|md)$/.test(file)) {
      const before = await fs.readFile(file, "utf8");
      let after = before;
      for (const [bad, good] of repairs) after = after.replaceAll(bad, good);
      if (after !== before) {
        await fs.writeFile(file, after);
        console.log(file);
      }
    }
  }
}
for (const dir of ["src", "docs"]) await visit(dir);
