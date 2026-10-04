import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        name: "Mortify",
        short_name: "Mortify",
        description: "Quiet help for prayer and examination.",
        theme_color: "#F5F0E6",
        background_color: "#F5F0E6",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
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
