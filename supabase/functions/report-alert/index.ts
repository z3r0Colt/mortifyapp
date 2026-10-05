import { authorized } from "../_shared/push.ts";
// Emails the operator when someone reports a message, so reports are read.
// The email names only the report; the message itself stays in the database.
Deno.serve(async (request) => {
  if (
    request.method !== "POST" ||
    !authorized(request, "MESSAGE_WEBHOOK_SECRET")
  )
    return new Response("Unauthorized", { status: 401 });
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("REPORT_ALERT_FROM");
  const to = Deno.env.get("REPORT_ALERT_TO") ?? "mortify@gentleking.org";
  if (!key || !from) return new Response("Not configured", { status: 500 });
  const body = await request.json().catch(() => null);
  const id = body?.record?.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
    return new Response("Invalid report", { status: 400 });
  const text = [
    "A message was reported in Mortify.",
    "",
    "The reporter's link was removed and the sender blocked at once. Please review the report in the Supabase SQL editor:",
    "",
    `select r.*, m.message_type, m.body, m.created_at as sent_at`,
    `from private.message_reports r left join public.messages m on m.id = r.message_id`,
    `where r.id = '${id}';`,
  ].join("\n");
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Mortify: a message was reported",
      text,
    }),
  });
  if (!sent.ok) return new Response("Email failed", { status: 502 });
  return new Response("Sent");
});
