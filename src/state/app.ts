import { create } from "zustand";
import { loadPacks, type Pack } from "../content/loader";
import { loadBible } from "../bible/loader";
import { resolveReference } from "../bible/resolver";
type State = {
  packs: Pack[];
  error: string | null;
  ready: boolean;
  load: () => Promise<void>;
};
export const useApp = create<State>((set) => ({
  packs: [],
  error: null,
  ready: false,
  load: async () => {
    try {
      const [packs, bible] = await Promise.all([loadPacks(), loadBible()]);
      for (const pack of packs) {
        for (const reference of pack.verses) resolveReference(bible, reference);
        for (const reading of [...pack.counsel, ...pack.afterFallReadings])
          if ("ref" in reading) resolveReference(bible, reading.ref);
      }
      set({ packs, ready: true, error: null });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unable to load content.",
      });
    }
  },
}));
