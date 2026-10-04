import { create } from "zustand";
import { db, type Security } from "../data/db";
import {
  deriveKey,
  newSalt,
  encryptText,
  decryptText,
} from "../privacy/crypto";
const check = "Mortify private storage v1";
import { isNative } from "../native/platform";
import { readNativeKey, storeNativeKey, clearNativeKey } from "../native/vault";
import { clearPrivateEntries, fetchVault, saveVault } from "../data/remote";
import { useAuth } from "./auth";
type State = {
  loaded: boolean;
  security: Security | null;
  key: CryptoKey | null;
  error: string;
  load: () => Promise<void>;
  setup: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  setLock: (enabled: boolean, pin?: string) => Promise<void>;
  setBiometrics: (enabled: boolean, pin: string) => Promise<void>;
  unlockBiometric: () => Promise<void>;
  forget: () => Promise<void>;
};
export const usePrivacy = create<State>((set, get) => ({
  loaded: false,
  security: null,
  key: null,
  error: "",
  load: async () => {
    const user = useAuth.getState().user;
    try {
      let security = (await db.security.get("main")) ?? null;
      if (security && security.userId !== user?.id) {
        await db.security.clear();
        security = null;
      }
      if (user && navigator.onLine)
        try {
          // The account holds the PIN check; this device keeps a copy for
          // opening offline and its own lock settings.
          const vault = await fetchVault(user.id);
          if (!vault) {
            if (security) {
              await clearNativeKey().catch(() => {});
              await db.security.clear();
            }
            security = null;
          } else if (!security || security.salt !== vault.salt) {
            security = {
              id: "main",
              userId: user.id,
              salt: vault.salt,
              verifier: vault.verifier,
              lockEnabled: true,
            };
            await db.security.put(security);
          }
        } catch {
          /* Offline or unreachable: use the copy on this device. */
        }
      set({
        security,
        loaded: true,
        error: "",
        key:
          security && !security.lockEnabled
            ? isNative()
              ? await readNativeKey().catch(() => null)
              : (security.deviceKey ?? null)
            : null,
      });
    } catch {
      set({ error: "Unable to open private storage." });
    }
  },
  setup: async (pin) => {
    if (!/^\d{6,12}$/.test(pin))
      throw new Error("Use a PIN of 6 to 12 digits.");
    const user = useAuth.getState().user;
    if (!user) throw new Error("Sign in first.");
    if (!navigator.onLine)
      throw new Error("Connect to the internet to set your PIN.");
    const salt = newSalt();
    const key = await deriveKey(pin, salt);
    const verifier = await encryptText(key, check);
    await saveVault(user.id, { salt, verifier });
    const security: Security = {
      id: "main",
      userId: user.id,
      salt,
      verifier,
      lockEnabled: true,
    };
    await db.security.put(security);
    set({ security, key });
  },
  unlock: async (pin) => {
    const security = get().security;
    if (!security) throw new Error("Set up a PIN first.");
    const key = await deriveKey(pin, security.salt);
    try {
      if ((await decryptText(key, security.verifier)) !== check)
        throw new Error();
    } catch {
      throw new Error("That PIN did not open your journal. Please try again.");
    }
    set({ key });
  },
  lock: () => {
    if (get().security?.lockEnabled) set({ key: null });
  },
  setLock: async (enabled, pin) => {
    const { security, key } = get();
    if (!security || !key) throw new Error("Unlock private storage first.");
    if (isNative()) {
      if (!enabled) {
        if (!pin)
          throw new Error("Enter your current PIN to save the key securely.");
        await get().unlock(pin);
        await storeNativeKey(pin, security.salt, false);
      } else await clearNativeKey();
    }
    const updated = {
      ...security,
      lockEnabled: enabled,
      deviceKey: enabled || isNative() ? undefined : key,
      biometricEnabled: false,
    };
    await db.security.put(updated);
    set({ security: updated });
  },
  setBiometrics: async (enabled, pin) => {
    const security = get().security;
    if (!security) throw new Error("Set a PIN first.");
    await get().unlock(pin);
    if (enabled) await storeNativeKey(pin, security.salt, true);
    else await clearNativeKey();
    const updated = {
      ...security,
      biometricEnabled: enabled,
      lockEnabled: true,
      deviceKey: undefined,
    };
    await db.security.put(updated);
    set({ security: updated });
  },
  unlockBiometric: async () => {
    const security = get().security;
    if (!security?.biometricEnabled)
      throw new Error("Biometric unlock is not enabled.");
    const key = await readNativeKey();
    if (!key || (await decryptText(key, security.verifier)) !== check)
      throw new Error("Use your PIN to open the journal.");
    set({ key });
  },
  forget: async () => {
    const user = useAuth.getState().user;
    if (!user) throw new Error("Sign in first.");
    if (!navigator.onLine)
      throw new Error("Connect to the internet to clear your journal.");
    await clearPrivateEntries(user.id);
    await clearNativeKey();
    await db.pending
      .where("userId")
      .equals(user.id)
      .filter((item) => item.table !== "flee_logs")
      .delete();
    await db.security.clear();
    set({ security: null, key: null });
  },
}));
export function journalKey() {
  const key = usePrivacy.getState().key;
  if (!key) throw new Error("Unlock your journal first.");
  return key;
}
