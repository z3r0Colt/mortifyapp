import sharp from "sharp";
// Every web icon comes from the one logo: a cream mark on black.
const logo = "assets/mortify-logo.png";
const black = { r: 0, g: 0, b: 0, alpha: 1 };
/** The logo shrunk to `scale` of the canvas, centred on black. */
async function padded(size, scale) {
  const inner = Math.round(size * scale);
  return sharp({
    create: { width: size, height: size, channels: 4, background: black },
  }).composite([
    {
      input: await sharp(logo).resize(inner, inner).png().toBuffer(),
      gravity: "center",
    },
  ]);
}
// Browsers and Android's install sheet show these as they are.
for (const size of [192, 512])
  await sharp(logo).resize(size, size).png().toFile(`public/icon-${size}.png`);
// iOS rounds the corners itself; a little room keeps the mountain tips clear.
await (await padded(180, 0.92)).png().toFile("public/icon-180.png");
// Android may crop to a circle: keep the whole mark inside the central safe zone.
await (await padded(512, 0.76)).png().toFile("public/icon-maskable-512.png");
// The small mark in the app's header and PIN screens.
await sharp(logo).resize(128, 128).png().toFile("public/logo-128.png");
// Android's status bar draws the notification badge as a single-colour
// silhouette, so it must be white on transparent: the cream mark becomes
// opaque white and the black background becomes clear.
const { data, info } = await sharp(logo)
  .resize(96, 96)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255;
  rgba[i * 4 + 3] = data[i];
}
await sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile("public/badge-96.png");
