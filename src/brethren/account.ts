import { cloud, result, supabase } from "./client";
import { db } from "../data/db";
import { deviceId } from "./push";
import { useAuth } from "../state/auth";
import { useBrethren } from "../state/brethren";
import { useMessages } from "../state/messages";
import { disableNativePush } from "../native/push";
export async function signOut() {
  await disableNativePush();
  const user = useAuth.getState().user;
  if (user && supabase && navigator.onLine) {
    await cloud()
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("device_id", await deviceId());
    await supabase.auth.signOut({ scope: "local" });
  }
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    await (await registration?.pushManager?.getSubscription())?.unsubscribe();
  }
  if (user) await db.outbox.where("userId").equals(user.id).delete();
  await db.cloudKv
    .filter(
      (row) => row.key.startsWith("sb-") || row.key.startsWith("sharing-"),
    )
    .delete();
  useAuth.setState({ user: null, ready: true });
  useBrethren.getState().clear();
  useMessages.setState({ rows: [], error: "" });
  window.location.replace("/");
}
export async function deleteAccount() {
  if (!navigator.onLine)
    throw new Error("Connect to the internet to delete your account.");
  await result(cloud().functions.invoke("delete-account", { body: {} }));
  await signOut();
}
