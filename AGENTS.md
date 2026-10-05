# Mortify Project Rules

These rules apply to every task in this project. Read them before writing code.

## What This App Is

Mortify helps a Christian put sin to death by the Spirit, following John Owen's _Of the Mortification of Sin in Believers_. The theology is confessional Reformed and follows the Westminster Confession of Faith.

The app is never the Savior. Every screen sends the user to Christ, the Word, prayer, the Lord's Day, and real brethren in his church. Never add features that try to keep him in the app longer. No gamification of any kind.

It ships first as a PWA, then wraps with Capacitor for the Google Play Store and the Apple App Store from the same code.

## Content Rule (Most Important)

Do NOT write Scripture text, Puritan quotes, catechism answers, or prayers yourself. All of that lives in JSON content packs in `public/content/` that I write and check by hand. When you need sample content, use obvious placeholders like `"PLACEHOLDER VERSE"`. Never invent a quote and attribute it to anyone.

## Look and Feel

Feels like an old pastor's study. Quiet, sober, warm. Nothing flashy.

- Light background #F5F0E6, text #1F1B16
- Dark background #16130F, text #EDE6D8
- Accent oxblood #7A2E2A, used sparingly
- Scripture references in brass #9C7A3C
- Headings in EB Garamond, body in Literata, small labels in Inter, all bundled with @fontsource so they work offline
- Colors defined as CSS variables, following the system light or dark setting unless the user picks Light or Dark in Settings. Text size (Standard, Large, Larger) scales from the root font size. These two display choices are kept in localStorage so they apply before the first paint
- All text meets WCAG AA contrast (4.5:1). Use `--brass-text` for brass-coloured type; `--brass` is for lines and decoration
- Large readable text, wide margins, generous line spacing
- Mobile first, sized for a phone held in one hand
- Respect safe areas with `env(safe-area-inset-*)` so nothing hides under the notch
- Simple fades only. No confetti, flames, badges, trophies, or mascots
- Never use red or shame language around a fall

## Wording in the UI

Plain, warm, pastoral, about a 10th grade level. Say "temptation" and "occasions of sin," not "triggers." Say "repentance," not "reset." Never say "journey" or "wellness."

## Tech Stack

- React with TypeScript and Vite
- Tailwind CSS using the CSS variables above
- React Router for navigation
- Zustand for app state
- Supabase (supabase-js) for all user data: preferences, logs, encrypted journal entries, and the brethren system. Every table is owner-only under row-level security
- Dexie (IndexedDB) only as an on-device cache for opening offline, a queue of entries waiting to upload, and settings for this one device
- Zod to validate content packs
- vite-plugin-pwa for install and offline reading: the app, Bible and content packs stay cached so Flee and the readings work without signal. Saving needs a connection or waits in the upload queue
- Capacitor added later for native builds and native plugins
- Deploy the PWA to GitHub Pages at https://mortify.gentleking.org (public repo, built by `.github/workflows/pages.yml` on every push to `main`). Never hard-code root paths like `/content/`; build them from `import.meta.env.BASE_URL` so a subfolder build still works

Write all code so it runs in a browser first. Anything that needs native power goes behind a small wrapper in `src/native/` that checks `Capacitor.isNativePlatform()` and falls back quietly on the web.

## Brethren System

Mortify has a small closed circle of brethren (up to 8, same sex only) who pray for and watch over one another. It is not a social network. No public feed, no stranger search, no likes, no images or links in messages. Each user controls exactly what his brethren see. Journal text is never shared.

## Privacy

Everyone signs in with an email code during onboarding. Journal, confession and reflection text is encrypted on the device with Web Crypto (AES-GCM) using a key derived from the user's PIN, and only the ciphertext goes to Supabase. The PIN and the key never leave the device; the account holds only a salt and an encrypted check value so the same PIN works on a new phone. No one else, including whoever runs Mortify, can read the text, and a forgotten PIN cannot be recovered. Brethren see only the events and messages the user chooses to share. No analytics, ads, or tracking scripts.

## How to Work

- Do only the task I give you. Do not start the next phase.
- Keep files small and focused. One screen per file in `src/screens/`.
- After each task, list the files you changed and tell me how to test it.
- If something is unclear, ask me before guessing.
