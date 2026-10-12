import { admin, authorized, sendPush } from "../_shared/push.ts";
type Due = { user_id: string; slot: "morning" | "evening"; local_date: string };
type Db = ReturnType<typeof admin>;
// How many people are reminded at once, and how long one run may keep going.
const PARALLEL = 10;
const BUDGET_MS = 40_000;
const MAX_PASSES = 6;
Deno.serve(async (request) => {
  if (request.method !== "POST" || !authorized(request, "REMINDER_SECRET"))
    return new Response("Unauthorized", { status: 401 });
  const db = admin();
  const started = Date.now();
  let sent = 0;
  // The database lists who is due (in their own time zone, within the last
  // few minutes, not yet sent), a page at a time. Anyone not reached in this
  // run is still due on the next one.
  for (
    let pass = 0;
    pass < MAX_PASSES && Date.now() - started < BUDGET_MS;
    pass++
  ) {
    const { data, error } = await db.rpc("due_reminders");
    if (error) return new Response("Unable to read reminders", { status: 500 });
    const due = (data ?? []) as Due[];
    if (!due.length) break;
    let reached = 0;
    for (let i = 0; i < due.length; i += PARALLEL) {
      if (Date.now() - started >= BUDGET_MS) break;
      const results = await Promise.all(
        due.slice(i, i + PARALLEL).map((row) => remind(db, row)),
      );
      reached += results.filter(Boolean).length;
    }
    sent += reached;
    // Everyone left failed this time; the next run tries them again.
    if (!reached) break;
  }
  return new Response(`Reminders sent: ${sent}`);
});
/** Claims one reminder, so it is sent once, and sends it. */
async function remind(db: Db, row: Due) {
  const claim = {
    p_user: row.user_id,
    p_slot: row.slot,
    p_date: row.local_date,
  };
  const { data: claimed, error } = await db.rpc("claim_reminder", claim);
  if (error || !claimed) return false;
  try {
    await sendPush(
      row.user_id,
      {
        title: "Mortify",
        body:
          row.slot === "morning"
            ? "Make room for today's reading."
            : "Make room for tonight's examination.",
        url: row.slot === "morning" ? "/reading" : "/examine",
        tag: `${row.slot}-${row.local_date}`,
      },
      false,
      true,
    );
    return true;
  } catch {
    await db.rpc("release_reminder", claim);
    return false;
  }
}
