import sharp from "sharp";
// Rounded icons for browsers that show the image as is.
for (const size of [192, 512])
  await sharp("public/icon.svg")
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
// Full-bleed square: iOS and Android round the corners themselves, and iOS
// would fill transparent corners with black. The letter stays inside the
// central safe zone that Android masks may crop to.
const square = (letterSize) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#F5F0E6"/><text x="256" y="${256 + letterSize * 0.33}" text-anchor="middle" font-family="Georgia,serif" font-size="${letterSize}" fill="#7A2E2A">M</text></svg>`,
  );
await sharp(square(270)).resize(180, 180).png().toFile("public/icon-180.png");
await sharp(square(220))
  .resize(512, 512)
  .png()
  .toFile("public/icon-maskable-512.png");
