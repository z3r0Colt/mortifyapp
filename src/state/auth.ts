import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../brethren/client";
export const useAuth = create<{ user: User | null; ready: boolean }>(() => ({
  user: null,
  ready: !supabase,
}));
export function watchAuth() {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) =>
    useAuth.setState({ user: session?.user ?? null, ready: true }),
  );
  void supabase.auth
    .getSession()
    .then(({ data }) =>
      useAuth.setState({ user: data.session?.user ?? null, ready: true }),
    );
  return () => data.subscription.unsubscribe();
}
