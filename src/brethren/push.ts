import { cloud, result } from "./client";
import { db } from "../data/db";
import { devicePlatform, isInstalled } from "../platform";
import { fromBase64 } from "../privacy/crypto";
export async function deviceId() {
  const stored = await db.cloudKv.get("device-id");
  if (stored) return stored.value;
  const value = crypto.randomUUID();
  await db.cloudKv.put({ key: "device-id", value });
  return value;
}
export async function enableWebPush(userId: string) {
  if (devicePlatform() === "ios" && !isInstalled())
    throw new Error(
      "On iPhone, add Mortify to your home screen before enabling notifications.",
    );
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    throw new Error("This browser does not support push notifications.");
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey)
    throw new Error("Push notifications have not been configured.");
  if ((await Notification.requestPermission()) !== "granted")
    throw new Error(
      "Notifications are not enabled. You can keep using Mortify.",
    );
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64(
        publicKey.replace(/-/g, "+").replace(/_/g, "/"),
      ),
    }));
  await result(
    cloud()
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          device_id: await deviceId(),
          platform: "web",
          subscription: subscription.toJSON(),
        },
        { onConflict: "user_id,device_id" },
      ),
  );
}
