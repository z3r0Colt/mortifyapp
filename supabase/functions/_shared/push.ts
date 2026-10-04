import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { sendFcm } from "./fcm.ts";
export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
export type Payload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};
function allowedEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === "https:" &&
      (url.hostname === "fcm.googleapis.com" ||
        url.hostname === "updates.push.services.mozilla.com" ||
        url.hostname.endsWith(".push.apple.com") ||
        url.hostname === "web.push.apple.com" ||
        url.hostname === "wns.windows.com" ||
        url.hostname.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}
export async function sendPush(
  userId: string,
  payload: Payload,
  urgent = false,
  webOnly = false,
) {
  const db = admin();
  const { data, error } = await db
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  const results = await Promise.allSettled(
    (data ?? []).map(async (row) => {
      if (row.platform !== "web") {
        if (webOnly) return;
        if (typeof row.subscription?.token !== "string")
          throw new Error("Invalid native token");
        if (!(await sendFcm(row.subscription.token, payload, urgent)))
          await db.from("push_subscriptions").delete().eq("id", row.id);
        return;
      }
      if (!allowedEndpoint(row.subscription?.endpoint))
        throw new Error("Unsupported push endpoint");
      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify(payload),
          {
            vapidDetails: {
              subject: Deno.env.get("VAPID_SUBJECT")!,
              publicKey: Deno.env.get("VAPID_PUBLIC_KEY")!,
              privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
            },
            urgency: urgent ? "high" : "normal",
            TTL: urgent ? 3600 : 86400,
          },
        );
      } catch (error) {
        const code = (error as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.from("push_subscriptions").delete().eq("id", row.id);
          return;
        }
        throw error;
      }
    }),
  );
  if (results.some((r) => r.status === "rejected"))
    throw new Error("Some notifications could not be delivered");
}
export function authorized(request: Request, secretName: string) {
  const secret = Deno.env.get(secretName);
  return !!secret && request.headers.get("x-mortify-secret") === secret;
}
