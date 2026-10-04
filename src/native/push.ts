import { FirebaseMessaging } from "./firebase";
import { isNative, nativePlatform } from "./platform";
import { cloud, result } from "../brethren/client";
import { deviceId } from "../brethren/push";
import { LocalNotifications } from "@capacitor/local-notifications";
export async function saveNativeToken(userId: string, token: string) {
  await result(
    cloud()
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          platform: nativePlatform(),
          device_id: await deviceId(),
          subscription: { token },
        },
        { onConflict: "user_id,device_id" },
      ),
  );
}
export async function enableNativePush(userId: string) {
  if (!isNative()) return false;
  if (nativePlatform() === "android")
    await LocalNotifications.createChannel({
      id: "mortify_messages",
      name: "Brethren messages",
      importance: 4,
      visibility: 0,
    });
  if ((await FirebaseMessaging.requestPermissions()).receive !== "granted")
    throw new Error(
      "Notifications are not enabled. You may keep using Mortify.",
    );
  const { token } = await FirebaseMessaging.getToken();
  await saveNativeToken(userId, token);
  return true;
}
export async function disableNativePush() {
  if (isNative()) await FirebaseMessaging.deleteToken().catch(() => {});
}
