import type { Sharing } from "./types";
export type SharingKey = keyof Omit<Sharing, "user_id">;
/** What a user may let his circle see, chosen at setup and in Sharing. */
export const sharingChoices: [SharingKey, string, string][] = [
  ["share_battles", "Battles", "The names of the battles you have chosen."],
  [
    "share_temptations",
    "Temptations",
    "When you ask for help in temptation and when you stood firm.",
  ],
  [
    "share_falls",
    "Falls",
    "A plain note that you fell and confessed, with no private detail.",
  ],
  [
    "share_blocker_status",
    "Protection status",
    "Whether your phone’s protection is on or off.",
  ],
];
