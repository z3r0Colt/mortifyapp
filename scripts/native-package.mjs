import fs from "node:fs";
const file = JSON.parse(fs.readFileSync("package.json", "utf8"));
file.overrides = { xcode: { uuid: "^11.1.1" } };
file.scripts["native:sync"] = "npm run build && node scripts/cap.cjs sync";
file.scripts["native:android"] = "node scripts/cap.cjs open android";
file.scripts["native:ios"] = "node scripts/cap.cjs open ios";
fs.writeFileSync("package.json", JSON.stringify(file, null, 2) + "\n");
