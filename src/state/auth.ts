import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../brethren/client";
import { db } from "../data/db";
export const useAuth = create<{ user: User | null; ready: boolean }>(() => ({
  user: null,
  ready: !supabase,
}));
/** The account saved on this device, for opening without a connection. */
async function savedUser(): Promise<User | null> {
  try {
    const rows = await db.cloudKv
      .filter(
        (row) => row.key.startsWith("sb-") && row.key.endsWith("-auth-token"),
      )
      .toArray();
    for (const row of rows) {
      const saved = JSON.parse(row.value) as { user?: User } | null;
      if (saved?.user?.id) return saved.user;
    }
  } catch {
    /* Nothing usable saved. */
  }
  return null;
}
export function watchAuth() {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // The first report is settled below, where an expired session that
    // cannot be refreshed offline still keeps the account.
    if (event === "INITIAL_SESSION" && !session) return;
    useAuth.setState({ user: session?.user ?? null, ready: true });
  });
  void supabase.auth.getSession().then(async ({ data, error }) => {
    let user = data.session?.user ?? null;
    // Offline after the hour-long session ran out, the account is still this
    // phone's; it is refreshed once the connection returns.
    // Only for a lost connection: a session the server has ended stays ended.
    if (
      !user &&
      (!navigator.onLine || error?.name === "AuthRetryableFetchError")
    )
      user = await savedUser();
    useAuth.setState({ user, ready: true });
  });
  return () => data.subscription.unsubscribe();
}
