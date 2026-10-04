import { create } from "zustand";
import { cloud, result, supabase } from "../brethren/client";
import type { Message } from "../brethren/messages";
import { useAuth } from "./auth";
export const useMessages = create<{
  rows: Message[];
  error: string;
  load: () => Promise<void>;
}>((set) => ({
  rows: [],
  error: "",
  load: async () => {
    const user = useAuth.getState().user;
    if (!user || !supabase) {
      set({ rows: [], error: "" });
      return;
    }
    try {
      const rows = await result(
        cloud()
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false })
          .limit(500),
      );
      if (useAuth.getState().user?.id === user.id)
        set({ rows: rows as Message[], error: "" });
    } catch {
      set({
        error:
          "Messages are unavailable while offline. Your private readings and entries still work.",
      });
    }
  },
}));
export function watchMessages(userId: string) {
  if (!supabase) return () => {};
  const refresh = () => {
    void useMessages.getState().load();
  };
  const channel = supabase
    .channel(`messages-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      refresh,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      },
      refresh,
    )
    .subscribe();
  refresh();
  window.addEventListener("online", refresh);
  return () => {
    window.removeEventListener("online", refresh);
    void cloud().removeChannel(channel);
  };
}
