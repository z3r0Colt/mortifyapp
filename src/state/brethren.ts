import { create } from "zustand";
import { cloud, result } from "../brethren/client";
import { useAuth } from "./auth";
import type {
  Profile,
  Sharing,
  LinkRequest,
  SentRequest,
} from "../brethren/types";
import { db } from "../data/db";
type State = {
  profile: Profile | null;
  peers: Profile[];
  requests: LinkRequest[];
  sent: SentRequest[];
  sharing: Sharing | null;
  loaded: boolean;
  error: string;
  load: () => Promise<void>;
  clear: () => void;
};
export const useBrethren = create<State>((set) => ({
  profile: null,
  peers: [],
  requests: [],
  sent: [],
  sharing: null,
  loaded: false,
  error: "",
  clear: () =>
    set({
      profile: null,
      peers: [],
      requests: [],
      sent: [],
      sharing: null,
      loaded: false,
      error: "",
    }),
  load: async () => {
    const user = useAuth.getState().user;
    if (!user) {
      set({
        profile: null,
        peers: [],
        requests: [],
        sent: [],
        sharing: null,
        loaded: true,
      });
      return;
    }
    try {
      const profile = (await result(
        cloud().from("profiles").select("*").eq("id", user.id).maybeSingle(),
      )) as Profile | null;
      if (!profile) {
        set({
          profile: null,
          peers: [],
          requests: [],
          sent: [],
          sharing: null,
          loaded: true,
          error: "",
        });
        return;
      }
      const [peers, requests, sharing, sent] = await Promise.all([
        result(
          cloud()
            .from("profiles")
            .select("*")
            .neq("id", user.id)
            .order("display_name"),
        ),
        result(cloud().rpc("pending_requests")),
        result(
          cloud()
            .from("shared_settings")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ),
        // Requests this user sent. Kept apart so the circle still opens
        // before the server has this function.
        result(cloud().rpc("sent_requests")).catch(() => []),
      ]);
      if (useAuth.getState().user?.id === user.id)
        await db.cloudKv.put({
          key: `sharing-${user.id}`,
          value: JSON.stringify(sharing),
        });
      if (useAuth.getState().user?.id === user.id)
        set({
          profile,
          peers: peers as Profile[],
          requests: requests as LinkRequest[],
          sent: sent as SentRequest[],
          sharing: sharing as Sharing,
          loaded: true,
          error: "",
        });
    } catch (e) {
      set({
        error:
          e instanceof Error
            ? e.message
            : "Unable to load brethren. Core features remain available offline.",
        loaded: true,
      });
    }
  },
}));
