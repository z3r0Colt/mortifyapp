# Widgets and discreet icon

Android uses a classic App Widget; iPhone uses WidgetKit. Both widgets contain only a Flee button. They open `mortify://flee`, retain the PIN/biometric gate, and do not access journal data. Widget updates are disabled because the button needs no changing information.

`scripts/ios-project.mjs` adds and embeds the MortifyWidget extension. Select your signing team for both App and MortifyWidget on the Mac. The widget bundle ID is `com.gentleking.mortify.widget`. It does not need Family Controls or an App Group. Keep its build/version numbers equal to the app when releasing.

Settings > Discreet icon enables the plain Notes appearance. Android changes the launcher label and icon through activity aliases. iOS changes the icon through `setAlternateIconName`; the installed app name remains Mortify because iOS does not offer a runtime rename API. The screen explains this limitation. Discreet notifications are a separate setting under Notifications.

Run `node scripts/native-icons.mjs` if changing artwork. The generated Notes PNGs are included in the App target's resources, including the iPad Pro size.

Test on each platform: add the widget; tap it with Mortify closed, open, and locked; verify Flee opens after unlocking. Enable and disable Notes, then reopen from the launcher and widget. Confirm there are no duplicate launcher icons. Test iPhone and iPad alternate icons; iOS displays its own icon-change confirmation. Test both light and dark appearance.

Sources: [Android widgets](https://developer.android.com/develop/ui/views/appwidgets), [WidgetKit](https://developer.apple.com/documentation/widgetkit), [alternate icons](<https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)>).
