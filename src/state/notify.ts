import { create } from "zustand";
import { devicePushEnabled } from "../brethren/push";
import { isNative } from "../native/platform";
import { devicePlatform, isInstalled } from "../platform";
import { useAuth } from "./auth";
/**
 * Whether this phone can hear from Mortify.
 * - ready: notifications are on for this device
 * - install: iPhone in Safari; it must be on the home screen first
 * - blocked: the person said no; only phone or browser settings can undo it
 * - off: allowed but not turned on yet
 * - unsupported: this browser cannot show web notifications
 */
export type NotifyState =
  "ready" | "install" | "blocked" | "off" | "unsupported";
async function check(): Promise<NotifyState> {
  const user = useAuth.getState().user;
  if (isNative())
    return user && (await devicePushEnabled(user.id).catch(() => false))
      ? "ready"
      : "off";
  if (devicePlatform() === "ios" && !isInstalled()) return "install";
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  )
    return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted" || !user) return "off";
  return (await devicePushEnabled(user.id).catch(() => false))
    ? "ready"
    : "off";
}
export const useNotify = create<{
  state: NotifyState | null;
  refresh: () => Promise<void>;
}>((set) => ({
  state: null,
  refresh: async () => set({ state: await check() }),
}));
