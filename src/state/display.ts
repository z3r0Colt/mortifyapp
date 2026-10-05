import { create } from "zustand";
export type Theme = "system" | "light" | "dark";
export type TextSize = "standard" | "large" | "larger";
type Display = { theme: Theme; text: TextSize };
const key = "mortify-display";
const fallback: Display = { theme: "system", text: "standard" };
// Display choices belong to this phone. They are read synchronously at
// start-up so the first screen already has the right colours and size.
export function readDisplay(): Display {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    return {
      theme: ["light", "dark"].includes(saved.theme) ? saved.theme : "system",
      text: ["large", "larger"].includes(saved.text) ? saved.text : "standard",
    };
  } catch {
    return fallback;
  }
}
export function applyDisplay({ theme, text }: Display) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  if (text === "standard") delete root.dataset.text;
  else root.dataset.text = text;
  // The status bar follows the chosen theme too.
  const colours = { light: "#F5F0E6", dark: "#16130F" };
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    const own = meta.media.includes("dark") ? colours.dark : colours.light;
    meta.content = theme === "system" ? own : colours[theme];
  }
}
export const useDisplay = create<
  Display & { set: (changes: Partial<Display>) => void }
>((set, get) => ({
  ...readDisplay(),
  set: (changes) => {
    const next = { theme: get().theme, text: get().text, ...changes };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Private browsing: the choice lasts until the app closes. */
    }
    applyDisplay(next);
    set(next);
  },
}));
