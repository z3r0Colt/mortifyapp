import { registerPlugin } from "@capacitor/core";
import { isNative } from "./platform";
import { importDataKey } from "../privacy/crypto";
type VaultPlugin = {
  available: () => Promise<{ available: boolean }>;
  store: (options: { key: string; biometric: boolean }) => Promise<void>;
  read: () => Promise<{ key: string }>;
  remove: () => Promise<void>;
};
const vault = registerPlugin<VaultPlugin>("MortifyVault");
export async function biometricAvailable() {
  if (!isNative()) return false;
  return (await vault.available().catch(() => ({ available: false })))
    .available;
}
/** Keeps the raw journal key in the phone's secure storage. */
export async function storeNativeKey(raw: string, biometric: boolean) {
  if (!isNative()) return;
  await vault.store({ key: raw, biometric });
}
export async function readNativeKey() {
  if (!isNative()) return null;
  const { key } = await vault.read();
  return importDataKey(key);
}
export async function clearNativeKey() {
  if (isNative()) await vault.remove();
}
