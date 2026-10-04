# Mortify Capacitor Prompts

Run these after the PWA and the brethren system are working. These turn Mortify into real store apps for Android and iPhone from the same code.

Android parts can be built on your Windows or Linux machine with Android Studio. Every iPhone part needs a Mac with Xcode and an Apple developer account.

---

## Native Part A Add Capacitor

Add Capacitor to the Mortify project with app id `com.gentleking.mortify` and app name Mortify. Add the Android and iOS platforms. Set the status bar and splash screen to the parchment color in light mode and the dark color in dark mode.

Add these plugins and wire each one through a wrapper in `src/native/` that falls back quietly on the web.

- Local Notifications for the morning and evening reminders on native, so they work without the server cron
- Push Notifications through Firebase Cloud Messaging, saving the token to `push_subscriptions` with the right platform
- Haptics for a gentle tap when the flee button is pressed
- A biometric auth plugin so he can unlock with fingerprint or Face ID in place of the PIN
- Secure storage for the encryption key on native

Update the push Edge Function to send through Firebase for android and ios rows and Web Push for web rows.

Explain every step I need to do in the Firebase console and in Xcode for push to work on iPhone.

---

## Native Part B Android Blocker

Write a custom Capacitor plugin for Android called MortifyShield in Kotlin.

It runs a local `VpnService` that filters DNS on the device. Block domains from a bundled blocklist file. Force SafeSearch for Google, Bing, DuckDuckGo, and YouTube by answering their DNS queries with the official SafeSearch addresses. Block common DNS-over-HTTPS hosts so browsers can't slip past.

Show a persistent notification while it runs. Expose `start()`, `stop()`, and `status()` to JavaScript, plus an event when the VPN stops.

When it stops, log a blocker_off event to Supabase so his brethren can see it if he shares blocker status. Replace the Private DNS guide with this on Android builds, but keep the guide as a fallback.

Walk him through turning on Always-on VPN and Block connections without VPN in Android settings. Write the Google Play VPN disclosure text for me.

Do not use the Accessibility API or Device Admin.

---

## Native Part C iPhone Blocker

Write the iOS side of the MortifyShield plugin in Swift using Apple's Family Controls and Managed Settings frameworks.

Request individual authorization with `AuthorizationCenter`. When granted, turn on Apple's adult content web filter through `ManagedSettingsStore`. Expose `start()`, `stop()`, and `status()` to JavaScript with the same shape as Android.

Check status each time the app opens. If authorization was revoked, log a blocker_off event.

Tell me exactly how to request the Family Controls entitlement from Apple, since Apple must approve it before the App Store will accept the app.

---

## Native Part D Widgets and Discreet Icon

Build a home screen widget that shows only the flee button and opens the flee sequence through a deep link. On Android use a Glance or classic App Widget. On iPhone use WidgetKit in Swift.

Add discreet mode that switches the app icon and name to a plain "Notes" look. On Android use activity aliases. On iPhone use alternate app icons.

---

## Native Part E Store Release

Write the Google Play listing, the App Store listing, and a plain privacy policy. Walk me through building a signed Android release bundle and uploading to Google Play's internal testing track. Then walk me through archiving in Xcode and sending a build to TestFlight.
