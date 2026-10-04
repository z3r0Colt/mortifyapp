import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { isNative } from "./platform";
import { usePreferences } from "../state/preferences";
import { queueEvent } from "../brethren/outbox";
import { useAuth } from "../state/auth";
export type ShieldStatus = {
  running: boolean;
  authorized: boolean;
  available: boolean;
};
type ShieldPlugin = {
  start: () => Promise<ShieldStatus>;
  stop: () => Promise<ShieldStatus>;
  status: () => Promise<ShieldStatus>;
  addListener: (
    name: "stopped",
    callback: () => void,
  ) => Promise<PluginListenerHandle>;
};
const shield = registerPlugin<ShieldPlugin>("MortifyShield");
let transitions: Promise<unknown> = Promise.resolve();
export async function shieldStatus(): Promise<ShieldStatus | null> {
  if (!isNative()) return null;
  return shield
    .status()
    .catch(() => ({ running: false, authorized: false, available: false }));
}
async function saveStatus(status: ShieldStatus) {
  const transition = transitions.then(async () => {
    const { value, save } = usePreferences.getState();
    if (status.running !== value.protectionEnabled) {
      await save({
        protectionEnabled: status.running,
        protectionCheckedAt: status.running ? Date.now() : undefined,
      });
      await queueEvent(status.running ? "blocker_on" : "blocker_off").catch(
        () => {},
      );
    }
  });
  transitions = transition.catch(() => {});
  await transition;
  return status;
}
export async function startShield() {
  if (!isNative()) return null;
  return saveStatus(await shield.start());
}
export async function stopShield() {
  if (!isNative()) return null;
  return saveStatus(await shield.stop());
}
export async function checkShield() {
  const status = await shieldStatus();
  if (
    status?.available &&
    usePreferences.getState().loaded &&
    useAuth.getState().ready
  )
    await saveStatus(status);
  return status;
}
export async function watchShield() {
  if (!isNative()) return () => {};
  const listener = await shield.addListener("stopped", () => {
    void checkShield();
  });
  return () => {
    void listener.remove();
  };
}
