import fs from "node:fs/promises";
import sharp from "sharp";
const normal = "assets/mortify-logo.png",
  notes = "public/notes-icon.svg";
for (const [density, size] of Object.entries({
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
})) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  await fs.mkdir(dir, { recursive: true });
  for (const name of [
    "ic_launcher",
    "ic_launcher_round",
    "ic_launcher_foreground",
  ])
    await sharp(normal)
      .resize(size, size)
      .flatten({ background: "#000000" })
      .png()
      .toFile(`${dir}/${name}.png`);
}
await sharp(normal)
  .resize(1024, 1024)
  .flatten({ background: "#000000" })
  .png()
  .toFile("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
for (const [name, size] of Object.entries({
  "NotesIcon@2x": 120,
  "NotesIcon@3x": 180,
  "NotesIcon~ipad": 76,
  "NotesIcon~ipad@2x": 152,
  "NotesIcon83.5@2x": 167,
}))
  await sharp(notes)
    .resize(size, size)
    .flatten({ background: "#F5F0E6" })
    .png()
    .toFile(`ios/App/App/${name}.png`);
