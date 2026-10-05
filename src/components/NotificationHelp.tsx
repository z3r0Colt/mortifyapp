import { devicePlatform, isInstalled } from "../platform";
// Plain steps for the two places people get stuck with notifications.
export function IphoneInstallSteps() {
  return (
    <ol className="numbered">
      <li>In Safari, tap the Share button.</li>
      <li>Choose Add to Home Screen.</li>
      <li>Turn on Open as Web App if shown, then tap Add.</li>
      <li>
        Open Mortify from your home screen and sign in once more. The home
        screen app keeps its own sign-in, separate from Safari.
      </li>
      <li>Tap Turn on notifications on the home page.</li>
    </ol>
  );
}
export function BlockedSteps() {
  const platform = devicePlatform();
  if (platform === "ios")
    return (
      <ol className="numbered">
        <li>Open the iPhone Settings app.</li>
        <li>Tap Notifications, then Mortify.</li>
        <li>Turn on Allow Notifications, then come back here.</li>
      </ol>
    );
  if (platform === "android" && isInstalled())
    return (
      <ol className="numbered">
        <li>Press and hold the Mortify icon on your home screen.</li>
        <li>Tap App info, then Notifications.</li>
        <li>Turn notifications on, then come back here.</li>
      </ol>
    );
  return (
    <ol className="numbered">
      <li>Tap the icon at the left of the address bar.</li>
      <li>Open Permissions or Site settings, then Notifications.</li>
      <li>Choose Allow, then come back here.</li>
    </ol>
  );
}
