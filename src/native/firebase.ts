import { registerPlugin } from "@capacitor/core";
import type { FirebaseMessagingPlugin } from "@capacitor-firebase/messaging";
// Use only the native bridge. Web Push is handled by our own service worker.
export const FirebaseMessaging =
  registerPlugin<FirebaseMessagingPlugin>("FirebaseMessaging");
