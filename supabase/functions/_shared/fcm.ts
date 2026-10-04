import { SignJWT, importPKCS8 } from "npm:jose@6";
import type { Payload } from "./push.ts";
type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};
let cached: { token: string; until: number } | null = null;
async function accessToken(account: ServiceAccount) {
  if (cached && cached.until > Date.now()) return cached.token;
  const key = await importPKCS8(account.private_key, "RS256");
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(account.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) throw new Error("Firebase authorization failed");
  const data = await response.json();
  cached = { token: data.access_token, until: Date.now() + 50 * 60000 };
  return cached.token;
}
export async function sendFcm(
  token: string,
  payload: Payload,
  urgent: boolean,
) {
  const account = JSON.parse(
    Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}",
  ) as ServiceAccount;
  if (!account.project_id || !account.client_email || !account.private_key)
    throw new Error("Firebase not configured");
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await accessToken(account)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: payload.title, body: payload.body },
          data: { url: payload.url },
          android: {
            priority: urgent ? "HIGH" : "NORMAL",
            notification: { channel_id: "mortify_messages", tag: payload.tag },
          },
          apns: {
            headers: { "apns-priority": "10" },
            payload: {
              aps: { alert: { title: payload.title, body: payload.body } },
            },
          },
        },
      }),
    },
  );
  if (!response.ok) {
    const body = await response.json();
    const code = body.error?.details?.find(
      (item: { errorCode?: string }) => item.errorCode,
    )?.errorCode;
    if (code === "UNREGISTERED") return false;
    throw new Error("Firebase delivery failed");
  }
  return true;
}
