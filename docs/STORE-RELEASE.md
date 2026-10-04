# Signed builds and testing releases

No store build has been uploaded. Account access, Firebase configuration, signing keys, reviewed content, physical-device checks, and Apple's Family Controls distribution approval remain required. Android source compilation was attempted here but blocked by the Windows sandbox at the SDK/JDK image transform. iOS needs a Mac. Do not describe those checks as passed.

## Before building

1. Replace and hand-check every `PLACEHOLDER` in `public/content/`, including source/translation permissions. Test with the content validator at `/debug`.
2. Configure and deploy Supabase using SUPABASE-SETUP.md, set client environment variables, and test disposable linked accounts. Do not bundle service-role keys. Set up Firebase per NATIVE-SETUP.md.
3. Follow ANDROID-SHIELD.md / IOS-SHIELD.md. Android production protection needs NDK 28.2.13676358 and the `mortifyShield` Gradle property. Confirm current Play eligibility for this local filter and submit its VPN declaration; eligibility is not assured by this implementation. Google requires documentation in the listing and appropriate disclosure/consent. See [VpnService policy](https://support.google.com/googleplay/android-developer/answer/12564964).
4. Complete the privacy-policy draft with a real operator/contact, provider retention and public URLs. Publish a working outside-app account deletion request page/path. Google requires both inside-app and outside-app deletion access for account apps. See [account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
5. Fill store privacy disclosures for the actual configuration: account/contact data, shared messages/events, religious beliefs inferred from the profile/activity, device notification identifiers, reports, and provider handling. Local-only journals are different from server-collected messages. Do not select "no data collected" for a brethren-enabled build. See [Apple app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
6. Test install/offline/reopen, encryption/lock/export/deletion, closed-app reminders/push, revocation, widgets, icon switching, accessible text, light/dark and phone safe areas. These checks need real devices. Keep listing claims aligned with tested features.

## Android signed AAB

1. Install current Android Studio, SDK 36, JDK 21, and the NDK above. Run `npm ci`, `npm run build`, then `npm run native:sync`. Open `android/` in Android Studio.
2. Enable protection for this release: set `mortifyShield=true` in your **local** Gradle project properties or pass `-PmortifyShield` when building. Verify native `libhev-socks5-tunnel.so` is present for supported ABIs. Test a release build, not just debug. Follow the upstream engine's MIT notices.
3. Set `versionCode` and `versionName` in `android/app/build.gradle`; increase the code for every upload. Select Build > Generate Signed Bundle / APK > Android App Bundle > app.
4. Create an upload keystore or select your existing one. Keep it and its passwords outside the repository, with a secure backup. Select release and finish the wizard. The signed `.aab` normally appears under `android/app/release/` or `android/app/build/outputs/bundle/release/`.
5. In Play Console, create/select Mortify with package `com.gentleking.mortify`. Configure Play App Signing, then Test and release > Testing > Internal testing. Create a release, upload the signed AAB, add release notes, resolve Console validation errors, save/review and roll out to the internal track.
6. Add your testers and share the track's opt-in URL. Install **from Play** and verify Firebase, widget, icons, encryption and VPN after reboot on several devices. Internal testing does not satisfy every account's separate production-access requirements. Complete the requirements Console shows before production.

Signing details: [Android app signing](https://developer.android.com/studio/publish/app-signing). Track instructions: [Play testing](https://support.google.com/googleplay/android-developer/answer/9845334).

## iPhone archive and TestFlight

1. Use a Mac with the Xcode/iOS SDK version currently required by App Store Connect (the current upload page lists iOS builds using Xcode 26 or later). Run `npm ci`, `npm run native:sync`, and `node scripts/ios-project.mjs`. Complete the Firebase SPM sync; the Windows template alone is incomplete.
2. Open `ios/App/App.xcodeproj`. Choose the same Apple Team for App and MortifyWidget. Confirm bundle IDs, version/build numbers, widget embedding, Notes icon resources, Firebase plist, Push Notifications, Remote notifications, and the **approved distribution** Family Controls entitlement/provisioning. Do not ship development-only provisioning.
3. Create the Mortify app record in App Store Connect using `com.gentleking.mortify`. Select a generic physical iOS device destination in Xcode, choose Product > Archive, then Organizer > Distribute App > App Store Connect > Upload. Validate and resolve every issue before uploading.
4. Wait for processing, then open App Store Connect > Mortify > TestFlight. Answer export-compliance questions accurately for the encryption used; do not assume exemption or add a false plist declaration. Add a build to an internal tester group and invite your App Store Connect testers. For external church testers, create an external group and submit for beta review as required.
5. Install from TestFlight on a physical iPhone. Verify production push, Family Controls permission/revocation, biometric enrollment changes, key deletion, cold-start Flee widget and alternate icons. TestFlight is a testing release; App Store release is a separate submission.

Apple sources: [upload builds and current Xcode requirements](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/), [archive/distribute](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases/), [internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers).
