export type Profile = {
  id: string;
  display_name: string;
  sex: "brother" | "sister";
  church_name: string | null;
  brethren_code: string;
  phone?: string | null;
  discreet_notifications?: boolean;
};
export type Sharing = {
  user_id: string;
  share_battles: boolean;
  share_temptations: boolean;
  share_falls: boolean;
  share_blocker_status: boolean;
};
export type LinkRequest = {
  link_id: string;
  requester_id: string;
  display_name: string;
  church_name: string | null;
};
export type SharedEvent = {
  id: string;
  user_id: string;
  event_type:
    "temptation" | "fall" | "stood_firm" | "blocker_off" | "blocker_on";
  battle_id: string | null;
  created_at: string;
};
