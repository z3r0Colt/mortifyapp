# Phase verification

This file records implementation and checks in prompt order. Content remains obvious placeholders until the owner supplies hand checked packs. Cloud deployment and native store validation require the owner's service accounts and build tools.

## Core 1 — Foundation

Files: package.json, package-lock.json, index.html, tsconfig.json, vite.config.ts, .gitignore, public/icon.svg, public/content/index.json, public/content/lust.json, src/vite-env.d.ts, src/content/loader.ts, src/state/app.ts, src/components/Page.tsx, src/screens/DebugScreen.tsx, src/App.tsx, src/main.tsx, src/styles.css.
Test: npm run build; npm run dev; open /debug. Check pack listing and system light/dark modes. The production service worker precaches content JSON and bundled fonts.

Validation: production build passed; 3 content loader tests passed; npm audit reported 0 vulnerabilities. Native config loading avoids the Windows sandbox's parent directory restriction. Requires Node 22.18+ or Node 24.

## Core 2 — Onboarding and Home

Files: src/data/db.ts, src/state/preferences.ts, src/components/{Action,TabBar}.tsx, src/content/{gospel,useContent}.ts, public/content/gospel.json, src/screens/{Gospel,Trust,GospelPath,Battles,Times,Home,Placeholder,Settings}Screen.tsx, src/App.tsx.
Test: complete each trust answer path, select a battle, choose times, reload and confirm onboarding stays complete. Home links lead to the intended temporary screens. Check the fixed tabs and safe areas on a phone.

Validation: production build passed.

## Core 3 — Flee sequence

Files: src/content/selection.ts, src/screens/FleeScreen.tsx, src/App.tsx.
Test: tap Flee, continue through verse, counsel, prayer, brethren placeholder and closing action. Try each answer and inspect IndexedDB > mortify > fleeLogs for time, selected battle and answer. Repeat offline after installing the production PWA.

Validation: production build passed.

## Core 4 — Evening examination

Files: src/data/{patterns,patterns.test}.ts, src/components/Tags.tsx, src/screens/{Examine,Patterns}Screen.tsx, src/App.tsx.
Test: save examinations with different roots and occasions; open weekly patterns and verify counts. Empty weeks display calmly. Free text stays in IndexedDB; phase 7 adds encryption before release.

Validation: production build and 4 tests passed.

## Core 5 — After a fall

Files: src/screens/FallScreen.tsx, src/components/Page.tsx, src/App.tsx.
Test: complete all five steps, with and without optional confession/reflection. Verify the local fall log. This flow uses neutral buttons and disables page fades. The final afterFallReadings entry is the assurance reading; supply hand checked content before release.

Validation: production build passed.

## Core 6 — Daily reading

Files: public/content/{catechism,lords-day}.json, src/content/{daily,daily.test}.ts, src/screens/ReadingScreen.tsx, src/App.tsx.
Test: open today's reading twice (same content), advance the date (next item), and check Saturday preparation card. Rotation is transactional so repeated component mounts cannot skip readings. Additional checked items are needed for meaningful rotation beyond the single placeholder.

Validation: production build and 5 tests passed.

## Core 7 — Privacy

Files: src/privacy/{crypto,crypto.test,data}.ts, src/state/privacy.ts, src/data/db.ts, src/screens/{Pin,Privacy,Examine,Fall,Settings}Screen.tsx, src/App.tsx.
Test: set PIN, save examination/confession, inspect IndexedDB (ciphertext only), reload and unlock. Wrong PIN must fail. Background the app and reopen. Disable/re-enable lock. Export and inspect your own readable JSON. Test forgotten PIN on disposable entries; confirm local journal/confessions clear. Test deletion on disposable data. Encryption uses PBKDF2 SHA-256 (600,000 iterations), random salt and a fresh 96-bit AES-GCM nonce per field.

Validation: production build and 7 tests passed, including wrong-PIN rejection, authentication-tag tampering and nonce uniqueness.

## Core 8 — Protection setup

Files: src/native/protection.ts, src/platform.ts, src/screens/ProtectionScreen.tsx, src/components/ProtectionReminder.tsx, src/screens/{Home,Settings}Screen.tsx, src/App.tsx.
Test: screen based battle displays setup and reminder; select Android/iPhone instructions; save checked status and verify monthly reminder hides. Uncheck and save: reminder returns. Non-screen battles hide the setup link. Native integration point is src/native/protection.ts.
Sources: [CleanBrowsing Private DNS](https://cleanbrowsing.org/support/mobile/android-private-dns), [Apple Screen Time](https://support.apple.com/en-us/105121), [Web Crypto key derivation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey).

Validation: production build passed.

## Core 9 — Polish and PWA launch preparation

Files: src/components/InstallCard.tsx, src/screens/SettingsScreen.tsx, public/icon-{180,192,512}.png, scripts/icons.mjs, package.json, package-lock.json, vite.config.ts, index.html, vercel.json, docs/PWA-DEPLOYMENT.md, .gitignore.
Test: production build and content precache inspection; follow the complete phone and offline checklist in PWA-DEPLOYMENT.md. Browser inventory is empty here; real visual/offline runtime checks remain outstanding. Vercel deployment is blocked by missing account/project access; no live URL exists yet. Further local implementation can proceed while that external dependency is pending.

## Brethren A — Backend

Files: supabase/migrations/20261003000{1_brethren,2_reminders}.sql, supabase/config.toml, supabase/schedule.sql, supabase/functions/{_shared/push,push-message/index,reminders/index}.ts, src/brethren/{client,push}.ts, src/state/auth.ts, src/screens/{SignIn,Notifications}Screen.tsx, src/sw.js, src/data/db.ts, src/App.tsx, vite.config.ts, package.json, package-lock.json, .env.example, docs/SUPABASE-SETUP.md.
Test: build locally; follow SUPABASE-SETUP.md for database, sign-in, Web Push and timezone reminders. Backend rollout and actual push delivery remain pending project credentials.

Validation: production build passed; executable PostgreSQL tests passed for RLS, same-sex restrictions, pending/accepted links, privacy revocation and eight-peer capacity. scripts/test-database.mjs, package.json and package-lock.json added for these checks.

## Brethren B — Profile and adding brethren

Files: src/brethren/types.ts, src/state/brethren.ts, src/components/{BrethrenGate,BrotherCard,TabBar}.tsx, src/screens/{ProfileSetup,Brethren,AddBrethren,Sharing}Screen.tsx, src/App.tsx, src/styles.css.
Test: sign in, create brother/sister profiles, share code, preview a known profile, request/accept/decline. Test mismatch and full circle. Long press or Options exposes quiet removal. Toggle each sharing choice and reload. Requires a configured Supabase test project for UI integration.

Validation: production build passed; database policies already tested in Part A.

## Brethren C — Messages

Files: supabase/migrations/202610030003_messages.sql, src/brethren/{messages,messages.test}.ts, src/state/messages.ts, src/components/{MessageComposer,MessageCard}.tsx, src/screens/{Messages,Brethren,Notifications}Screen.tsx, src/App.tsx, src/styles.css.
Test: send each message type between accepted test peers, reply in thread, pray once per request, mark read/answered, verify 24-hour calm highlighting and private notifications. Turn battle sharing off and check old message battle IDs clear. Enable Realtime publication and verify new messages appear in a second device.

Validation: production build, 8 unit tests and database access/message tests passed. All source files formatted for readability with Prettier.

## Brethren D — Shared profiles

Files: supabase/migrations/202610030004_shared_profiles.sql, src/brethren/profiles.ts, src/screens/SharedProfileScreen.tsx, src/screens/BrethrenScreen.tsx, src/App.tsx, src/styles.css. Also corrected prayer counts across the whole circle and added accessible switch semantics in Action/SharingScreen.
Test: view a linked profile and your own preview with every sharing combination. Verify battles/timeline/falls/protection visibility, quiet fall wording, and three contact actions. Battle publication is wired in Part E.

Validation: production build and database tests passed.

## Brethren E — Integration

Files: supabase/migrations/202610030005_integration.sql, src/brethren/outbox.ts, src/data/db.ts, src/state/brethren.ts, src/components/{PrayerStep,TellBrethrenStep,TabBar}.tsx, src/screens/{ContactSettings,Flee,Fall,Protection,Brethren}Screen.tsx, src/App.tsx.
Test: request prayer in Flee online/offline, reconnect with the app open, verify one request per accepted peer and idempotent events. Stand firm shares when enabled. Tell brethren shares a fall only when enabled and a separate optional message. Protection change shares only when enabled. Add optional phone and check tel link. Verify unread dot and shared battle publication.
Outbox contains only explicit messages and selected event metadata; it never receives journal or confession text. Delivery resumes while the app is open or on reopening; a closed browser cannot promise immediate background delivery. Server sharing choices are checked again on delivery.

Validation: production build and database tests passed.

## Brethren F — Safety and cleanup

Files: supabase/migrations/202610030006_safety.sql, supabase/functions/delete-account/index.ts, src/brethren/account.ts, src/screens/SettingsScreen.tsx, src/components/MessageCard.tsx, docs/SUPABASE-SETUP.md.
Test: report an incoming message and verify the peer cannot relink or see messages; sign out offline and verify readings/journal remain; delete a disposable account online and verify cascades. Core features do not require Supabase. Real cloud/device visual checks remain pending service access and a connected browser.

Validation: production build, 8 unit tests and database tests passed. Account deletion function deployment/device checks remain external prerequisites.

## Native A — Capacitor

Files: capacitor.config.json, android/ and ios/ generated platforms, src/native/{platform,haptics,appearance,reminders,push,vault,lifecycle}.ts, Android/iOS MortifyVault plugins, Android Gradle/theme/manifest/MainActivity, iOS AppDelegate/SceneDelegate/Info.plist/theme and MortifyViewController, src/privacy/{crypto,data}.ts, src/state/privacy.ts, src/data/db.ts, src/screens/{Home,Pin,Privacy,Notifications,Settings}Screen.tsx, src/brethren/account.ts, src/App.tsx, supabase/functions/_shared/{push,fcm}.ts, reminders/index.ts, scripts/{cap,native-package,ios-project}, package files, docs/NATIVE-SETUP.md, .gitignore.
Test: web build/unit tests; sync Android; follow NATIVE-SETUP.md for Firebase, native reminders, haptics, biometric enrollment/unlock/PIN fallback and key deletion. Full native compilation and device checks remain pending; iOS package sync/build requires a Mac (Windows symlink creation was denied).

Validation: web build/unit tests passed; Android sync passed. Existing JDK/SDK were found and SDK 36 was installed in an isolated workspace SDK. Gradle compilation then failed at the JDK image transform with a sandbox AccessDeniedException for core-for-system-modules.jar. A full native app has not been successfully compiled or device tested; later direct Kotlin/resource checks are recorded below.

## Native B — Android blocker

Files: Android MortifyShieldPlugin.kt, shield/{DnsWire,DnsFilter,TunnelEngine,LocalSocks,ShieldVpnService}.kt, assets/shield-blocklist.txt, jni/*, DnsWireTest.kt, MainActivity/manifest/Gradle, native/vendor/hev-socks5-tunnel and pinned dependencies, scripts/vendor-tunnel.mjs, src/native/{protection,lifecycle}.ts, src/components/NativeProtectionCard.tsx, src/screens/ProtectionScreen.tsx, docs/ANDROID-SHIELD.md, .gitignore.
Test: compile with -PmortifyShield and follow ANDROID-SHIELD.md for DNS, SafeSearch, normal networking, Always-on/lockdown and stop events. Physical-device verification is required before release. Default builds honestly retain the setup guide when no engine is included.

## Native C — iPhone blocker

Files: ios/App/App/{MortifyShieldPlugin.swift,MortifyViewController.swift,App.entitlements}, scripts/ios-project.mjs, docs/IOS-SHIELD.md.
Test: follow IOS-SHIELD.md on a Mac and physical iPhone. Approval from Apple, native compilation, revocation checks and TestFlight validation remain pending external access.

## Native D — Widgets and discreet icon

Files: Android FleeWidget.kt and MortifyAppearancePlugin.kt, MainActivity/manifest, res/{layout,drawable,xml}/flee_widget* and notes_icon, native launcher icons; ios/App/MortifyWidget/_, App/{MortifyAppearancePlugin.swift,MortifyViewController.swift,Info.plist,NotesIcon_.png}, AppIcon asset and Xcode project; public/notes-icon.svg; src/native/discreet.ts, src/screens/{Discreet,Settings}Screen.tsx, src/App.tsx, scripts/{ios-project,native-icons}.mjs, docs/WIDGETS-DISCREET.md.
Test: add each widget and tap with the app closed/open/locked. Check Flee opens after unlocking. Toggle Notes and return to Mortify; check iPhone/iPad icon resources and launcher behavior. iOS alternate icons cannot rename the installed app at runtime; the UI explains that limitation.

Validation: Android resources/manifest processed successfully. Custom Android Kotlin sources compiled directly against the SDK/dependencies. The iOS project generator was run repeatedly and produces one embedded widget target; iOS compilation/device checks remain pending a Mac.

## Native E — Store release

Files: docs/{STORE-LISTINGS,PRIVACY-POLICY-DRAFT,STORE-RELEASE}.md, README.md.
Test: review the drafts, complete operator/contact/retention fields, then follow the signed Android bundle/internal-track and Xcode archive/TestFlight instructions. Content placeholders, external services, native builds, filtering tests and entitlement approval must be completed before releasing.

Validation: current primary-source store instructions were checked. No signed release or store upload was made; account details/signing are not available.

## Final integration checks

Files: src/App.test.tsx, src/screens/{Times,Protection,SharedProfile}Screen.tsx, src/components/TellBrethrenStep.tsx, src/brethren/{account,outbox}.ts, src/native/{protection,push}.ts, src/main.tsx, src/privacy/data.ts, src/styles.css; Android vault/DNS/socket fixes; scripts/{test-database,check-edge,check-dns}.mjs and DnsWireSmoke.kt; supabase/functions/_shared/fcm.ts; package files and .gitignore.
Tests: `npm test`, `npm run test:database`, `npm run build`, `npm run check:edge`, `npm audit`. Component checks cover onboarding requirements and an encrypted examination with lock/wrong-PIN protection. PostgreSQL checks also cover private reports, blocked relinking, battle-sharing revocation and account-deletion cascades. `JAVA_HOME` plus `node scripts/check-dns.mjs` runs A/AAAA/NXDOMAIN and malformed DNS checks using the downloaded Gradle Kotlin compiler. Android `:app:processDebugResources` passed, and a direct Kotlin compilation passed; these do not replace a full APK build.

Privacy corrections preserve local settings on sign-out, prevent cached fall sharing from contradicting the displayed choice, wait for authentication before recording native status changes, and stop native filtering on device deletion. Native builds do not register the PWA service worker. Religious content remains placeholders. Source/docs were formatted; instructions and prompt files received formatting only.

Still pending: connected-browser visual/install/offline checks, Vercel/Supabase/Firebase deployment and real notification delivery, signed Android networking/device tests, Mac/iOS SPM sync and native compilation, Apple entitlement approval, operator policy fields, and store submissions.
