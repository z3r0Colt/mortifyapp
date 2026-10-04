import { create } from "zustand";
import { db, defaultPreferences, type Preferences } from "../data/db";
type State = {
  value: Preferences;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (changes: Partial<Preferences>) => Promise<void>;
};
export const usePreferences = create<State>((set, get) => ({
  value: defaultPreferences,
  loaded: false,
  error: null,
  load: async () => {
    try {
      set({
        value: (await db.preferences.get("main")) ?? defaultPreferences,
        loaded: true,
        error: null,
      });
    } catch {
      set({
        error:
          "Local storage is unavailable. Allow storage for Mortify, then reload.",
      });
    }
  },
  save: async (changes) => {
    const value = { ...get().value, ...changes, id: "main" as const };
    await db.preferences.put(value);
    set({ value });
  },
}));
