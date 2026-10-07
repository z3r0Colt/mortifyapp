import type { Pack } from "./loader";
import { useApp } from "../state/app";
import { usePreferences } from "../state/preferences";
export function useBattlePacks() {
  const packs = useApp((s) => s.packs);
  const ids = usePreferences((s) => s.value.battles);
  return packs.filter((p) => ids.includes(p.id));
}
/** Prayers of confession, shown after a fall: the original first. */
export const fallPrayers = (pack: Pack) =>
  pack.prayers.filter((p) => p.for === "fall");
/** Prayers for the hour of temptation; Flee shows one of them. */
export const fleePrayers = (pack: Pack) =>
  pack.prayers.filter((p) => p.for === "flee");
export function randomItem<T>(items: T[]): T {
  if (!items.length) throw new Error("Choose a battle in Settings first.");
  return items[Math.floor(Math.random() * items.length)];
}
