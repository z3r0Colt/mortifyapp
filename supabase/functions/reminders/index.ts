import { admin, authorized, sendPush } from "../_shared/push.ts";
Deno.serve(async (request) => {
  if (request.method !== "POST" || !authorized(request, "REMINDER_SECRET"))
    return new Response("Unauthorized", { status: 401 });
  const db = admin();
  const { data: settings, error } = await db
    .from("reminder_settings")
    .select("*")
    .eq("enabled", true);
  if (error) return new Response("Unable to read reminders", { status: 500 });
  const now = new Date();
  for (const setting of settings ?? []) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: setting.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now);
      const value = (type: string) => parts.find((p) => p.type === type)?.value;
      const time = `${value("hour")}:${value("minute")}`;
      const date = `${value("year")}-${value("month")}-${value("day")}`;
      for (const slot of ["morning", "evening"]) {
        if (setting[slot].slice(0, 5) !== time) continue;
        const { data: claimed, error } = await db.rpc("claim_reminder", {
          p_user: setting.user_id,
          p_slot: slot,
          p_date: date,
        });
        if (error || !claimed) continue;
        try {
          await sendPush(
            setting.user_id,
            {
              title: "Mortify",
              body:
                slot === "morning"
                  ? "Make room for today's reading."
                  : "Make room for tonight's examination.",
              url: slot === "morning" ? "/reading" : "/examine",
              tag: `${slot}-${date}`,
            },
            false,
            true,
          );
        } catch {
          await db.rpc("release_reminder", {
            p_user: setting.user_id,
            p_slot: slot,
            p_date: date,
          });
        }
      }
    } catch {
      /* Invalid time zones are skipped without leaking profile data. */
    }
  }
  return new Response("Reminders checked");
});
