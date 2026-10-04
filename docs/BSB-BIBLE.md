# Berean Standard Bible integration

The full text is downloaded from the official [BSB downloads page](https://berean.bible/downloads.htm), using its [plain-text download](https://bereanbible.com/bsb.txt). The official [licensing page](https://berean.bible/licensing.htm) declares the text public domain. Mortify stores its wording unchanged; it does not generate Scripture text.

`public/bible/bsb.json` is keyed by the official book name, chapter number, and verse number. Chapter/verse keys are JSON strings. The download has 66 books, 1,189 chapters, and 31,102 numbered slots; 31,086 slots contain main text and 16 are empty in the source. Empty slots are retained rather than filled from another translation. `public/bible/source.json` records URLs, timestamps, counts, omitted references, and SHA-256 hashes.

## Content pack format

Scripture is a reference only:

```json
"verses": ["Romans 8:13", "Psalm 119:9-11"]
```

Counsel and after-fall readings may contain either an existing hand-checked excerpt or a Scripture reference:

```json
"afterFallReadings": [
  {"ref": "Romans 8:13"},
  {"text": "PLACEHOLDER READING", "author": "PLACEHOLDER AUTHOR", "source": "PLACEHOLDER SOURCE"}
]
```

`ref` contains no verse text. A Scripture reading cannot also contain an inline `text` field. Puritan excerpts, prayers, catechism answers, and gospel copy remain owner-authored content; this task does not replace their placeholders. The sample battle uses the two references supplied in the task.

The resolver accepts full book names, numbered books, Psalm/Psalms, Song of Solomon/Song of Songs, case/spacing differences, single verses, same-chapter ranges and cross-chapter ranges such as `John 3:36-4:2`. Hyphens, en dashes, and em dashes work. Invalid/reversed/out-of-bounds references fail. A reference with no official BSB main text fails; ranges crossing an omitted slot return the available text and identify the omission. Chapters keep the official verse numbers.

## Reading and offline behavior

Flee, morning readings, patterns, after-fall Scripture readings and James 5:16 use the shared Scripture component. It displays BSB beside each reference and a small Read the chapter link. The chapter reader uses the same theme, safe areas and fonts. Opening it preserves the underlying screen, including unsaved confession text and flow state; returning does not write the draft to disk or upload it.

The full Bible is fetched once per app session and included in the production service-worker precache. The caching size limit is raised explicitly because the JSON is about 4.1 MB. The Vercel rewrite excludes Bible JSON while allowing chapter-reader routes to serve the SPA.

## Files changed

- `public/bible/{bsb,source}.json`, `public/content/lust.json`
- `src/bible/{loader,resolver,resolver.test}.ts`
- `src/components/{Scripture,ContentReading,TellBrethrenStep}.tsx`
- `src/screens/{Chapter,Flee,Reading,Patterns,Fall}Screen.tsx`
- `src/content/{loader,loader.test}.ts`, `src/state/app.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`
- `scripts/{import-bsb,check-bible-cache}.mjs`, `.gitignore`, `vite.config.ts`, `vercel.json`
- `README.md`, `docs/BSB-BIBLE.md`
- Generated Capacitor web assets in `android/app/src/main/assets/public/` and `ios/App/App/public/` were refreshed so both platforms include the same Bible and reader.

## How to test

1. Run `npm test`. Tests validate every `ref` and `verses` field in every JSON content file, plus all indexed pack schemas. Changing one reference to `Romans 8:999` must fail. Resolver tests cover aliases, ranges, omissions, and integrity/counts. The component test opens a chapter during a fall and verifies the unfinished confession survives.
2. Run `npm run build`, then `node scripts/check-bible-cache.mjs`. The check fails unless the exact full JSON is copied and included in `dist/sw.js`'s precache manifest.
3. Run `npm run preview`; complete onboarding/PIN setup. In Flee, Today's Reading and Patterns, verify the official verse text, small BSB label, chapter link and readable chapter. In the fall flow, type a temporary confession, open James 5, return and finish; verify the saved private text. A `{ "ref": "…" }` entry can be used to check after-fall/counsel Scripture displays.
4. In a real browser, load the production app online and wait for the worker to finish installing. Close other old app tabs/reopen so the current worker controls the page; then disconnect and reload. Verify Flee, ranges, and complete chapters work offline. A build-manifest check is not a substitute for that browser check.

To refresh the official text, run `node scripts/import-bsb.mjs` and rerun all checks. The raw download is retained in ignored `.bible-source/` for inspection. The importer stops if its canonical counts change, so a changed source requires review.

Validation for this change: 29 tests and the production build passed. The cache-build check confirmed that the unchanged 4,099,441-byte Bible is in the precache. The chapter-return test preserved the encrypted confession through the reader. No connected browser was available, so the live offline/device check remains a manual test.
