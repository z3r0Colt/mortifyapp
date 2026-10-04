import { create } from "zustand";
import { db, defaultPreferences, type Preferences } from "../data/db";
import { fetchPreferences, savePreferences } from "../data/remote";
import { useAuth } from "./auth";
type State = {
  value: Preferences;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (changes: Partial<Preferences>) => Promise<void>;
};
// Preferences live in the account. A copy stays on this device so Flee and
// the readings still open without a connection.
export const usePreferences = create<State>((set, get) => ({
  value: defaultPreferences,
  loaded: false,
  error: null,
  load: async () => {
    const user = useAuth.getState().user;
    if (!user) {
      set({ value: defaultPreferences, loaded: true, error: null });
      return;
    }
    let cached: (Preferences & { userId?: string }) | undefined;
    try {
      cached = await db.preferences.get("main");
    } catch {
      set({
        error:
          "Local storage is unavailable. Allow storage for Mortify, then reload.",
      });
      return;
    }
    const mine = cached?.userId === user.id ? cached : undefined;
    if (mine) {
      const { userId: _, ...value } = mine;
      set({ value, loaded: true, error: null });
    }
    try {
      const value = (await fetchPreferences(user.id)) ?? defaultPreferences;
      if (useAuth.getState().user?.id !== user.id) return;
      await db.preferences.put({ ...value, userId: user.id });
      set({ value, loaded: true, error: null });
    } catch {
      if (!mine)
        set({
          error: navigator.onLine
            ? "Could not open your account. Please try again."
            : "Connect to the internet to open Mortify on this phone for the first time.",
        });
    }
  },
  save: async (changes) => {
    const user = useAuth.getState().user;
    if (!user) throw new Error("Sign in first.");
    if (!navigator.onLine)
      throw new Error(
        "You're offline. Connect to the internet to save this change.",
      );
    const value = { ...get().value, ...changes, id: "main" as const };
    await savePreferences(user.id, value);
    await db.preferences.put({ ...value, userId: user.id });
    set({ value });
  },
}));
