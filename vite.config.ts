import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // The custom domain serves from the root. Set BASE_PATH only for a subfolder build.
  base: process.env.BASE_PATH ?? "/",
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "prompt",
      includeAssets: ["content/*.json", "icon.svg", "icon-*.png"],
      manifest: {
        id: "./",
        name: "Mortify",
        short_name: "Mortify",
        description:
          "Quiet help for prayer, examination, and putting sin to death by the Spirit.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#F5F0E6",
        background_color: "#F5F0E6",
        categories: ["books", "lifestyle"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // Long-press the home screen icon on Android to go straight to Flee.
        shortcuts: [
          {
            name: "Flee",
            short_name: "Flee",
            description: "Turn to Christ in the hour of temptation.",
            url: "./flee",
            icons: [{ src: "icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ["bible/*.json", "**/*.{js,css,html,json,svg,png,woff2}"],
      },
    }),
  ],
});
