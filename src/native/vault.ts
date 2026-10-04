import { registerPlugin } from "@capacitor/core";
import { isNative } from "./platform";
import { deriveKey, toBase64, fromBase64 } from "../privacy/crypto";
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
export async function storeNativeKey(
  pin: string,
  salt: string,
  biometric: boolean,
) {
  if (!isNative()) return;
  const key = await deriveKey(pin, salt, true);
  const raw = await crypto.subtle.exportKey("raw", key);
  await vault.store({ key: toBase64(new Uint8Array(raw)), biometric });
}
export async function readNativeKey() {
  if (!isNative()) return null;
  const { key } = await vault.read();
  return crypto.subtle.importKey(
    "raw",
    fromBase64(key),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function clearNativeKey() {
  if (isNative()) await vault.remove();
}
