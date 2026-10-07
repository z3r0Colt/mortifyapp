import { create } from "zustand";
// Words still being written, kept in memory only so that locking Mortify
// mid-sentence does not lose them. Never written to the device; cleared once
// saved, and when the account changes.
const useDrafts = create<{ drafts: Record<string, unknown> }>(() => ({
  drafts: {},
}));
export function useDraft<T extends object>(name: string, initial: T) {
  const saved = useDrafts((s) => s.drafts[name] as Partial<T> | undefined);
  const value = { ...initial, ...saved } as T;
  const update = (changes: Partial<T>) =>
    useDrafts.setState((s) => ({
      drafts: {
        ...s.drafts,
        [name]: { ...(s.drafts[name] as Partial<T>), ...changes },
      },
    }));
  const clear = () =>
    useDrafts.setState((s) => {
      const drafts = { ...s.drafts };
      delete drafts[name];
      return { drafts };
    });
  return [value, update, clear] as const;
}
export function clearDrafts() {
  useDrafts.setState({ drafts: {} });
}
