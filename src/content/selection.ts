import { useApp } from "../state/app";
import { usePreferences } from "../state/preferences";
export function useBattlePacks() {
  const packs = useApp((s) => s.packs);
  const ids = usePreferences((s) => s.value.battles);
  return packs.filter((p) => ids.includes(p.id));
}
export function randomItem<T>(items: T[]): T {
  if (!items.length) throw new Error("Choose a battle in Settings first.");
  return items[Math.floor(Math.random() * items.length)];
}
