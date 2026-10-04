# Capacitor and Firebase setup

The app id is com.gentleking.mortify. Capacitor 8 platforms and plugins are installed. Native wrappers check Capacitor.isNativePlatform() and use quiet web fallbacks. Android sync passed. JDK 21 was found and SDK 36 was installed in an isolated workspace SDK, but compilation failed because the Windows sandbox denied the JDK image transform access to an SDK JAR. Native binaries have not been built or device tested. This runner has no Xcode.

## Build tools and sync

1. Install Android Studio, Android SDK 36 and the JDK required by Capacitor 8 (JDK 21). Set SDK/JDK paths normally in Android Studio; do not commit local.properties. Run `npm run native:sync`, then `npm run native:android`.
2. On a Mac, install Xcode and its command-line tools, clone/copy the project, run `npm ci` and `npm run native:sync`, then `npm run native:ios`. The CLI uses Swift Package Manager. Firebase Messaging requires a distinct package identity; the config requests its symlink under CapApp-SPM. This Windows runner could not create that symlink, so rerun sync on the Mac to complete Package.swift. Do not treat the current iOS package template as a successful sync.
3. scripts/cap.cjs supplies a shell fallback for managed Windows environments where Node cannot query account metadata. It does not change OS settings. The xcode transitive uuid dependency is overridden to its patched version; npm audit passes.
4. MortifyVault is a local Capacitor biometric/secure-storage plugin. Android wraps the journal key with AndroidKeyStore AES-GCM, requiring a strong biometric for each biometric read. iOS uses a device-only Keychain item with biometryCurrentSet. PIN remains the recovery method if biometric enrollment changes. No journal key is sent to a server. Android disables backups and screenshots. Test secure-key deletion and PIN fallback on real devices before release.
5. Native reminders use Local Notifications and user permission; they do not require cloud sign-in. They use the device's local time, and Android battery restrictions may delay them. No exact-alarm permission is requested. Server cron dispatches reminder pushes only to web subscriptions, avoiding duplicate native reminders.

## Firebase console

1. Create/select a Firebase project with Analytics disabled. In Project settings > General add an Android app with package com.gentleking.mortify. Download google-services.json into android/app/ (keep it out of source control). The Gradle file already applies the Google Services plugin when the file exists.
2. Add an iOS app with bundle id com.gentleking.mortify. Download GoogleService-Info.plist, add it to the App target in Xcode and ensure Copy Bundle Resources includes it. AppDelegate calls FirebaseApp.configure() only when the file is present.
3. In Project settings > Cloud Messaging enable HTTP v1 access. In the Google Cloud IAM console grant the server's dedicated service account only Firebase Cloud Messaging send access (Firebase Cloud Messaging API Admin, scoped to this project). Generate its private JSON credential and store the JSON as FIREBASE_SERVICE_ACCOUNT in Supabase Edge Function secrets. Never place it in the client, Vercel VITE_ variables, or Git. Redeploy push-message and reminders.
4. Register one device from Notifications > Enable message notifications. The Firebase Messaging plugin supplies an FCM token on BOTH Android and iOS; an APNs device token alone is not an FCM token. It is saved to push_subscriptions with android/ios. Token refresh updates the device row. Sign-out deletes the Firebase registration token.
5. Test message delivery with foreground, background, screen locked, and app terminated states. Prayer requests use Android high priority; APNs uses alert priority 10. Delivery timing is controlled by the OS/provider and cannot be guaranteed. Invalid FCM registrations are removed.

## iPhone APNs / Xcode

1. Enroll in the Apple Developer Program, select your Team in Signing & Capabilities, and register the explicit bundle id com.gentleking.mortify.
2. Add Push Notifications and Background Modes > Remote notifications to the App target. Confirm the provisioning profile includes the aps-environment entitlement. Xcode manages development/production values when signing.
3. In Apple Developer > Certificates, Identifiers & Profiles > Keys, create an APNs key for the app/team, download the .p8 once and keep it securely. In Firebase > Project settings > Cloud Messaging > Apple app configuration upload that key, Key ID and Team ID. Keep the .p8 out of the repository.
4. Use the FirebaseMessaging plugin without @capacitor/push-notifications: the maintainer warns the two plugins conflict on iOS. AppDelegate forwards APNs registration and remote-notification callbacks to Capacitor. Analytics and automatic token collection are disabled in native configuration; notifications are enabled by the user.
5. Build on a physical iPhone. Allow notifications, register FCM, send a test prayer request from a linked account, and confirm discreet mode hides names. TestFlight uses production APNs; repeat there.

Sources: [Capacitor](https://capacitorjs.com/docs), [local reminders](https://capacitorjs.com/docs/apis/local-notifications), [Firebase Messaging plugin](https://capawesome.io/docs/sdks/capacitor/firebase/cloud-messaging/), [Android biometrics](https://developer.android.com/identity/sign-in/biometric-auth), [FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging/migrate-v1).
