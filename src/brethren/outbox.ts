import { db } from "../data/db";
import { cloud, result, supabase } from "./client";
import { useAuth } from "../state/auth";
import { useBrethren } from "../state/brethren";
import { usePreferences } from "../state/preferences";
import { plainMessage } from "./messages";
import type { SharedEvent, Sharing } from "./types";
export type OutboxItem = {
  id: string;
  userId: string;
  time: number;
  payload:
    | { kind: "prayer"; battle: string | null }
    | { kind: "event"; event: SharedEvent["event_type"]; battle: string | null }
    | { kind: "note"; body: string };
};
let flushing = false;
export async function flushOutbox() {
  const user = useAuth.getState().user;
  if (flushing || !user || !supabase || !navigator.onLine) return;
  flushing = true;
  try {
    for (const item of await db.outbox
      .where("userId")
      .equals(user.id)
      .sortBy("time")) {
      if (useAuth.getState().user?.id !== item.userId) break;
      const p = item.payload;
      try {
        if (p.kind === "prayer")
          await result(
            cloud().rpc("send_circle", {
              p_battle: p.battle,
              p_client: item.id,
            }),
          );
        else if (p.kind === "note")
          await result(
            cloud().rpc("send_circle_note", {
              p_body: p.body,
              p_client: item.id,
            }),
          );
        else
          await result(
            cloud().rpc("share_event", {
              p_type: p.event,
              p_battle: p.battle,
              p_client: item.id,
              p_time: new Date(item.time).toISOString(),
            }),
          );
        await db.outbox.delete(item.id);
      } catch {
        break;
      }
    }
  } finally {
    flushing = false;
  }
}
async function enqueue(
  payload: OutboxItem["payload"],
  id = crypto.randomUUID(),
) {
  const user = useAuth.getState().user;
  if (!user || !supabase)
    throw new Error("Sign in and link with your brethren first.");
  const brethren = useBrethren.getState();
  if (
    payload.kind !== "event" &&
    navigator.onLine &&
    brethren.loaded &&
    !brethren.error &&
    (!brethren.profile || !brethren.peers.length)
  )
    throw new Error(
      "Link with a trusted brother or sister before sending to your circle.",
    );
  await db.outbox.put({ id, userId: user.id, time: Date.now(), payload });
  void flushOutbox();
}
export async function requestPrayer(battle: string) {
  await enqueue({ kind: "prayer", battle });
}
export async function circleNote(body: string) {
  if (body.length > 500)
    throw new Error("Keep your message to 500 characters.");
  const clean = plainMessage(body);
  if (!clean) throw new Error("Write a short message without links.");
  await enqueue({ kind: "note", body: clean });
}
export async function queueEvent(
  event: SharedEvent["event_type"],
  battle?: string,
  id = crypto.randomUUID(),
) {
  const user = useAuth.getState().user;
  if (!user || !supabase) return;
  let sharing = useBrethren.getState().sharing;
  if (!sharing) {
    const cached = await db.cloudKv.get(`sharing-${user.id}`);
    if (cached) sharing = JSON.parse(cached.value) as Sharing;
  }
  if (!sharing) return;
  const allowed =
    event === "fall"
      ? sharing.share_falls
      : ["temptation", "stood_firm"].includes(event)
        ? sharing.share_temptations
        : sharing.share_blocker_status;
  if (!allowed) return;
  await enqueue(
    {
      kind: "event",
      event,
      battle: sharing.share_battles ? (battle ?? null) : null,
    },
    id,
  );
}
export async function publishBattles() {
  const { profile, sharing } = useBrethren.getState();
  if (!profile || !sharing || !navigator.onLine) return;
  await result(
    cloud()
      .from("shared_battles")
      .upsert({
        user_id: profile.id,
        battle_ids: sharing.share_battles
          ? usePreferences.getState().value.battles
          : [],
      }),
  );
}
export function watchOutbox() {
  const flush = () => {
    void flushOutbox();
    void publishBattles().catch(() => {});
  };
  const visibility = () => {
    if (document.visibilityState === "visible") flush();
  };
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", visibility);
  const timer = setInterval(flush, 30000);
  flush();
  return () => {
    clearInterval(timer);
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", visibility);
  };
}
