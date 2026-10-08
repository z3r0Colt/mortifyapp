import { cloud, result } from "./client";
import type { Profile, Sharing, SharedEvent } from "./types";
export async function sharedProfile(id: string) {
  const [profile, sharing, events, battles, blocker] = await Promise.all([
    result(cloud().from("profiles").select("*").eq("id", id).single()),
    result(
      cloud().from("shared_settings").select("*").eq("user_id", id).single(),
    ),
    result(
      cloud()
        .from("shared_events")
        .select("*")
        .eq("user_id", id)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .order("created_at", { ascending: false }),
    ),
    result(
      cloud()
        .from("shared_battles")
        .select("battle_ids")
        .eq("user_id", id)
        .maybeSingle(),
    ),
    result(
      cloud()
        .from("shared_events")
        .select("*")
        .eq("user_id", id)
        .in("event_type", ["blocker_on", "blocker_off"])
        .order("created_at", { ascending: false })
        .limit(1),
    ),
  ]);
  const settings = sharing as Sharing;
  const permitted = (event: SharedEvent) =>
    event.event_type === "fall"
      ? settings.share_falls
      : ["temptation", "stood_firm"].includes(event.event_type)
        ? settings.share_temptations
        : settings.share_blocker_status;
  return {
    profile: profile as Profile,
    battles: settings.share_battles
      ? ((battles?.battle_ids ?? []) as string[])
      : [],
    events: (events as SharedEvent[]).filter(permitted).map((event) => ({
      ...event,
      battle_id: settings.share_battles ? event.battle_id : null,
    })),
    blockerOff:
      settings.share_blocker_status &&
      blocker?.[0]?.event_type === "blocker_off",
  };
}
export function eventLabel(type: SharedEvent["event_type"]) {
  return {
    temptation: "Tempted",
    fall: "Fell and confessed",
    stood_firm: "Stood firm",
    blocker_off: "Protection off",
    blocker_on: "Protection on",
  }[type];
}

/**
 * Names and churches are plain words: no web addresses or hidden characters.
 * The database refuses them too; this gives the reason in plain words first.
 */
export function checkPlainName(text: string, field: string) {
  if (
    /(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(text) ||
    /[\u0000-\u001f\u007f]/.test(text)
  )
    throw new Error(`Your ${field} cannot include a web address.`);
}
