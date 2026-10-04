# Mortify Core Prompts

Put AGENTS.md in the project root first. Paste one phase at a time in a fresh chat. Test each phase on your phone before moving on.

---

## Phase 1 Foundation

Create a new Vite project for an app named Mortify using React and TypeScript, following AGENTS.md. Add Tailwind, React Router, Zustand, Dexie, Zod, vite-plugin-pwa, and the three fonts from @fontsource.

Build the full light and dark theme as CSS variables. Set up the PWA manifest with the name Mortify, a placeholder icon, the parchment background color, and standalone display.

Create a content pack loader that fetches JSON from `public/content/` and validates it with Zod. Each pack has this shape.

```json
{
  "id": "lust",
  "name": "Lust and Pornography",
  "screenBased": true,
  "verses": [{ "ref": "", "text": "" }],
  "counsel": [{ "text": "", "author": "", "source": "" }],
  "prayers": [{ "title": "", "text": "" }],
  "examinationQuestions": [""],
  "fleeActions": [""],
  "afterFallReadings": [{ "text": "", "author": "", "source": "" }]
}
```

Add `public/content/index.json` listing every pack. Make one sample pack called `lust.json` filled with placeholders only. Add a debug page at `/debug` that lists every loaded pack.

Make the service worker cache every content pack so the app works fully offline.

---

## Phase 2 Onboarding and Home

Build onboarding with these screens in order.

1. A gospel screen that shows text from `public/content/gospel.json` (placeholder for now)
2. A question asking if the user is trusting in Christ alone, with "Yes," "No," and "I'm not sure." The last two open a gentle gospel path screen and then let him continue
3. Choose battles from the loaded packs (multi select)
4. Pick a morning reading time and an evening examination time

Save all of it with Dexie.

Then build the home screen. A large round oxblood flee button sits in the center. Below it are two quiet cards for "Today's Reading" and "Tonight's Examination." A small plain "I have fallen" text link sits at the bottom. Add a simple bottom tab bar with Home, Examine, and Settings. The cards and link can lead to empty placeholder screens for now.

---

## Phase 3 Flee Sequence

Tapping the flee button opens a full screen sequence. Each step fills the screen and moves on with a tap.

1. One random verse from the user's battle packs in large type
2. One short counsel with author and source in small text
3. One prayer
4. A placeholder screen that says "Ask your brethren to pray" (it gets wired up later)
5. A closing screen saying "Now get up and go." with one random flee action from the pack, then a question, "Did you stand firm?" with "Yes, by God's grace" and "Not yet"

Save a log row in Dexie with the time, battle, and answer. Never ask the user to type anything in this flow. The whole sequence must work offline.

---

## Phase 4 Evening Examination

Build the examination screen. Show three questions from the pack. Let him tag heart roots (loneliness, weariness, anger, boredom, self-pity, pride, unbelief) and occasions (time of day, place, activity). Add a free text box. Save to Dexie.

Build a weekly patterns screen that shows the most common roots and occasions as simple horizontal bars in plain words. Below the bars, show one verse and one counsel from the pack.

---

## Phase 5 After a Fall

Build a gentle flow from the "I have fallen" link.

1. Show readings from `afterFallReadings`
2. A confession screen with an optional text box and a pack prayer
3. A placeholder screen for telling his brethren (wired up later)
4. A short look back with two examination questions
5. A closing reading on assurance

Log the fall in Dexie. No red, no shame words, no animations.

---

## Phase 6 Daily Reading

Build the morning reading screen. It shows one Scripture passage from his packs, one catechism question from `public/content/catechism.json`, and one counsel excerpt. Rotate them so they don't repeat too soon. On Saturdays, add a short card about preparing for the Lord's Day.

---

## Phase 7 Privacy

Add a PIN lock on app open, with an option to turn it off. Derive an encryption key from the PIN with PBKDF2 and encrypt all journal and confession text in Dexie with AES-GCM using Web Crypto. If the PIN is forgotten, explain plainly that the journal cannot be recovered and offer to clear it and start over.

Add an export button that downloads his own data as a JSON file, and a button that deletes everything on the device.

---

## Phase 8 Protection Setup Guide

A web app cannot filter the phone's internet, so build a guided setup screen instead. It appears only for screen based battles.

For Android, walk him step by step through setting Private DNS to a free family filter such as CleanBrowsing's family filter.

For iPhone, walk him step by step through Screen Time, turning on Content and Privacy Restrictions, choosing Limit Adult Websites, and giving the Screen Time passcode to his wife or a brother.

Detect the platform from the user agent and show the right steps first. Add a checkbox, "My protection is set up," and a gentle monthly reminder card asking him to check it is still on.

Leave a clear spot in the code for the native blocker that comes later with Capacitor.

---

## Phase 9 Polish and Launch the PWA

Go through every screen and check it against AGENTS.md for colors, fonts, wording, spacing, safe areas, and dark mode. Test offline mode. Add an install prompt that explains how to add Mortify to the home screen on Android and on iPhone. Deploy to Vercel and tell me each step.
