import { registerPlugin } from "@capacitor/core";
import { isNative } from "./platform";
import { db } from "../data/db";
const appearance = registerPlugin<{
  setDiscreet: (options: { enabled: boolean }) => Promise<{ enabled: boolean }>;
}>("MortifyAppearance");
export async function setDiscreet(enabled: boolean) {
  if (!isNative()) return false;
  await appearance.setDiscreet({ enabled });
  await db.cloudKv.put({ key: "discreet-icon", value: enabled ? "on" : "off" });
  return true;
}
