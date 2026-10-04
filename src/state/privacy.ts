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
    try {
      const security = (await db.security.get("main")) ?? null;
      set({
        security,
        loaded: true,
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
    const salt = newSalt();
    const key = await deriveKey(pin, salt);
    const verifier = await encryptText(key, check);
    const security: Security = {
      id: "main",
      salt,
      verifier,
      lockEnabled: true,
    };
    // Encrypt early-phase plaintext before committing the new security record.
    const journals = await db.journals.toArray();
    const falls = await db.falls.toArray();
    const encryptedJournals = await Promise.all(
      journals.map(async (row) => ({
        ...row,
        text:
          typeof row.text === "string"
            ? await encryptText(key, row.text)
            : row.text,
      })),
    );
    const encryptedFalls = await Promise.all(
      falls.map(async (row) => ({
        ...row,
        confession:
          typeof row.confession === "string"
            ? await encryptText(key, row.confession)
            : row.confession,
        reflection:
          typeof row.reflection === "string"
            ? await encryptText(key, row.reflection)
            : row.reflection,
      })),
    );
    await db.transaction(
      "rw",
      [db.journals, db.falls, db.security],
      async () => {
        await db.journals.bulkPut(encryptedJournals);
        await db.falls.bulkPut(encryptedFalls);
        await db.security.put(security);
      },
    );
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
    await clearNativeKey();
    await db.transaction(
      "rw",
      [db.journals, db.falls, db.security],
      async () => {
        await db.journals.clear();
        await db.falls.clear();
        await db.security.clear();
      },
    );
    set({ security: null, key: null });
  },
}));
export function journalKey() {
  const key = usePrivacy.getState().key;
  if (!key) throw new Error("Unlock your journal first.");
  return key;
}
