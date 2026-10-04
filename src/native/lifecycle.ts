import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { FirebaseMessaging } from "./firebase";
import { isNative } from "./platform";
import { nativeAppearance } from "./appearance";
import { usePrivacy } from "../state/privacy";
import { useAuth } from "../state/auth";
import { saveNativeToken } from "./push";
import { flushOutbox } from "../brethren/outbox";
import { checkShield, watchShield } from "./protection";
export async function nativeLifecycle(navigate: (path: string) => void) {
  if (!isNative()) return () => {};
  const safeNavigate = (path: unknown) => {
    if (
      typeof path === "string" &&
      ["/flee", "/reading", "/examine", "/brethren/messages"].includes(path)
    )
      navigate(path);
  };
  const deepLink = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "mortify:" && parsed.hostname === "flee")
        navigate("/flee");
    } catch {
      /* Unsupported links are ignored. */
    }
  };
  const handles = await Promise.all([
    App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) usePrivacy.getState().lock();
      else {
        void nativeAppearance();
        void flushOutbox();
        void checkShield();
      }
    }),
    App.addListener("appUrlOpen", ({ url }) => deepLink(url)),
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => safeNavigate(event.notification.extra?.url),
    ),
    FirebaseMessaging.addListener("notificationActionPerformed", (event) =>
      safeNavigate(
        (event.notification.data as { url?: string } | undefined)?.url,
      ),
    ),
    FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
      const user = useAuth.getState().user;
      if (user) void saveNativeToken(user.id, token).catch(() => {});
    }),
  ]);
  const stopWatching = await watchShield().catch(() => () => {});
  const launch = await App.getLaunchUrl();
  if (launch?.url) deepLink(launch.url);
  void nativeAppearance();
  void checkShield();
  return () => {
    stopWatching();
    handles.forEach((handle) => {
      void handle.remove();
    });
  };
}
