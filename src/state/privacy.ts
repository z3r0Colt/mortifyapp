import { create } from "zustand";
import { db, type Security } from "../data/db";
import {
  importDataKey,
  newDataKey,
  newRecoveryCode,
  newSalt,
  normalizeRecoveryCode,
  unwrapDataKey,
  wrapDataKey,
} from "../privacy/crypto";
import { isNative } from "../native/platform";
import { readNativeKey, storeNativeKey, clearNativeKey } from "../native/vault";
import {
  enrollPasskey,
  unlockWithPasskey,
  type Passkey,
} from "../privacy/passkey";
import {
  clearPrivateEntries,
  fetchVault,
  saveVault,
  updateVault,
} from "../data/remote";
import { useAuth } from "./auth";
const pinPattern = /^\d{6,12}$/;
type State = {
  loaded: boolean;
  security: Security | null;
  /** The account holds a journal this phone has no PIN for yet. */
  hasVault: boolean;
  key: CryptoKey | null;
  error: string;
  /** A recovery code to show once, then forget. */
  recoveryCode: string | null;
  /** Why the code is showing: a first PIN, or a replacement code. */
  recoveryReason: "setup" | "new" | null;
  load: () => Promise<void>;
  setup: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  setLock: (enabled: boolean, pin?: string) => Promise<void>;
  setBiometrics: (enabled: boolean, pin: string) => Promise<void>;
  setLockAfter: (minutes: number) => Promise<void>;
  unlockBiometric: () => Promise<void>;
  changePin: (current: string, next: string) => Promise<void>;
  recover: (code: string, pin: string) => Promise<void>;
  replaceRecoveryCode: (pin: string) => Promise<void>;
  /** Confirms the user still has the recovery code; throws if it is wrong. */
  checkRecoveryCode: (code: string) => Promise<void>;
  snoozeCodeCheck: () => Promise<void>;
  acknowledgeRecoveryCode: () => void;
  forget: () => Promise<void>;
};
function online(action: string) {
  if (!navigator.onLine)
    throw new Error(`Connect to the internet to ${action}.`);
}
const day = 86400000;
/**
 * After three wrong PINs in a row, wait 30 seconds; each further mistake
 * doubles the wait, up to 15 minutes.
 */
export function pinDelay(failed: number) {
  if (failed < 3) return 0;
  return Math.min(30_000 * 2 ** (failed - 3), 15 * 60_000);
}
/** "30 seconds", "2 minutes": how long until the next try. */
export function waitText(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
/** Once a year, ask whether the recovery code is still at hand. */
export function codeCheckDue(security: Security | null, now = Date.now()) {
  return (
    !!security?.codeCheckedAt &&
    now - security.codeCheckedAt > 365 * day &&
    (security.codeCheckSnoozedUntil ?? 0) < now
  );
}
function signedIn() {
  const user = useAuth.getState().user;
  if (!user) throw new Error("Sign in first.");
  return user;
}
export const usePrivacy = create<State>((set, get) => {
  /** Opens the journal key with the PIN, or explains that the PIN is wrong. */
  const rawKey = async (pin: string) => {
    const security = get().security;
    if (!security) throw new Error("Set up a PIN first.");
    try {
      return await unwrapDataKey(pin, security.salt, security.pinKey);
    } catch {
      throw new Error("That PIN did not open your journal. Please try again.");
    }
  };
  /** Saves changes to this phone's security record. */
  const patch = async (changes: Partial<Security>) => {
    const security = get().security;
    if (!security) return;
    const updated = { ...security, ...changes };
    await db.security.put(updated);
    set({ security: updated });
  };
  /** Locks the key under a new PIN on this phone only. The PIN-locked copy
   *  never goes to the account: a short PIN could be guessed there offline. */
  const savePin = async (
    userId: string,
    raw: string,
    pin: string,
    keyId: string | undefined,
  ) => {
    const salt = newSalt();
    const pinKey = await wrapDataKey(pin, salt, raw);
    const security: Security = {
      ...(get().security ?? { id: "main", userId, lockEnabled: true }),
      salt,
      pinKey,
      keyId,
      pinLength: pin.length,
    };
    await db.security.put(security);
    set({ security, key: await importDataKey(raw) });
  };
  return {
    loaded: false,
    security: null,
    hasVault: false,
    key: null,
    error: "",
    recoveryCode: null,
    recoveryReason: null,
    load: async () => {
      const user = useAuth.getState().user;
      try {
        let security = (await db.security.get("main")) ?? null;
        if (security && (security.userId !== user?.id || !security.pinKey)) {
          await db.security.clear();
          security = null;
        }
        let hasVault = !!security;
        if (user && navigator.onLine)
          try {
            // The account holds the key locked by the recovery code; this
            // phone holds its own copy locked by its PIN.
            const vault = await fetchVault(user.id);
            hasVault = !!vault;
            const stale =
              !vault || (security?.keyId && security.keyId !== vault.key_id);
            if (security && stale) {
              // The journal was cleared, or begun again on another phone.
              await clearNativeKey().catch(() => {});
              await db.security.clear();
              security = null;
            } else if (security && vault && !security.keyId) {
              // Set up before keys had ids: this copy matched the account.
              security = { ...security, keyId: vault.key_id };
              await db.security.put(security);
            }
          } catch {
            /* Offline or unreachable: use the copy on this device. */
          }
        if (security && !security.codeCheckedAt) {
          security = { ...security, codeCheckedAt: Date.now() };
          await db.security.put(security);
        }
        set({
          security,
          hasVault,
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
      if (!pinPattern.test(pin))
        throw new Error("Use a PIN of 6 to 12 digits.");
      const user = signedIn();
      online("set your PIN");
      if (await fetchVault(user.id)) {
        set({ hasVault: true });
        throw new Error(
          "Your journal is already in your account. Open it with your recovery code.",
        );
      }
      const raw = newDataKey();
      const code = newRecoveryCode();
      const salt = newSalt();
      const recoverySalt = newSalt();
      const keyId = crypto.randomUUID();
      await saveVault(user.id, {
        key_id: keyId,
        recovery_salt: recoverySalt,
        recovery_key: await wrapDataKey(code, recoverySalt, raw),
      });
      const security: Security = {
        id: "main",
        userId: user.id,
        salt,
        pinKey: await wrapDataKey(pin, salt, raw),
        keyId,
        lockEnabled: true,
        codeCheckedAt: Date.now(),
        pinLength: pin.length,
      };
      await db.security.put(security);
      set({
        security,
        hasVault: true,
        key: await importDataKey(raw),
        recoveryCode: code,
        recoveryReason: "setup",
      });
    },
    unlock: async (pin) => {
      const security = get().security;
      const wait = (security?.lockedUntil ?? 0) - Date.now();
      if (wait > 0)
        throw new Error(`Too many tries. Please wait ${waitText(wait)}.`);
      let raw: string;
      try {
        raw = await rawKey(pin);
      } catch (e) {
        // Counted on this phone, so reloading does not start over.
        const failedPins = (security?.failedPins ?? 0) + 1;
        const delay = pinDelay(failedPins);
        await patch({
          failedPins,
          lockedUntil: delay ? Date.now() + delay : undefined,
        });
        if (delay)
          throw new Error(
            `That PIN is not right. Please wait ${waitText(delay)} before trying again.`,
          );
        throw e;
      }
      if (
        security?.failedPins ||
        security?.lockedUntil ||
        security?.pinLength !== pin.length
      )
        await patch({
          failedPins: 0,
          lockedUntil: undefined,
          pinLength: pin.length,
        });
      set({ key: await importDataKey(raw) });
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
          await storeNativeKey(await rawKey(pin), false);
        } else await clearNativeKey();
      }
      const updated = {
        ...security,
        lockEnabled: enabled,
        deviceKey: enabled || isNative() ? undefined : key,
        biometricEnabled: false,
        passkey: undefined,
      };
      await db.security.put(updated);
      set({ security: updated });
    },
    setBiometrics: async (enabled, pin) => {
      const security = get().security;
      if (!security) throw new Error("Set a PIN first.");
      const raw = await rawKey(pin);
      let passkey: Passkey | undefined;
      if (isNative()) {
        if (enabled) await storeNativeKey(raw, true);
        else await clearNativeKey();
      } else if (enabled) passkey = await enrollPasskey(raw);
      const updated = {
        ...security,
        biometricEnabled: enabled,
        passkey,
        lockEnabled: true,
        deviceKey: undefined,
      };
      await db.security.put(updated);
      set({ security: updated, key: await importDataKey(raw) });
    },
    setLockAfter: async (minutes) => {
      const security = get().security;
      if (!security) return;
      const updated = { ...security, lockAfter: minutes };
      await db.security.put(updated);
      set({ security: updated });
    },
    unlockBiometric: async () => {
      const security = get().security;
      if (!security?.biometricEnabled)
        throw new Error("Biometric unlock is not enabled.");
      const key = isNative()
        ? await readNativeKey().catch(() => null)
        : security.passkey
          ? await unlockWithPasskey(security.passkey)
              .then(importDataKey)
              .catch(() => null)
          : null;
      if (!key) throw new Error("Use your PIN to open the journal.");
      set({ key });
    },
    changePin: async (current, next) => {
      if (!pinPattern.test(next))
        throw new Error("Use a new PIN of 6 to 12 digits.");
      const user = signedIn();
      await savePin(
        user.id,
        await rawKey(current),
        next,
        get().security?.keyId,
      );
    },
    recover: async (input, pin) => {
      const code = normalizeRecoveryCode(input);
      if (!code)
        throw new Error("Enter all 20 letters and numbers of your code.");
      if (!pinPattern.test(pin))
        throw new Error("Use a new PIN of 6 to 12 digits.");
      const user = signedIn();
      online("use your recovery code");
      const vault = await fetchVault(user.id);
      if (!vault) throw new Error("There is no journal to recover.");
      let raw: string;
      try {
        raw = await unwrapDataKey(
          code,
          vault.recovery_salt,
          vault.recovery_key,
        );
      } catch {
        throw new Error("That recovery code does not match. Please check it.");
      }
      await savePin(user.id, raw, pin, vault.key_id);
      await patch({
        codeCheckedAt: Date.now(),
        codeCheckSnoozedUntil: undefined,
      });
    },
    replaceRecoveryCode: async (pin) => {
      const user = signedIn();
      online("make a new recovery code");
      const raw = await rawKey(pin);
      const code = newRecoveryCode();
      const recoverySalt = newSalt();
      await updateVault(user.id, {
        recovery_salt: recoverySalt,
        recovery_key: await wrapDataKey(code, recoverySalt, raw),
      });
      await patch({
        codeCheckedAt: Date.now(),
        codeCheckSnoozedUntil: undefined,
      });
      set({ recoveryCode: code, recoveryReason: "new" });
    },
    checkRecoveryCode: async (input) => {
      const code = normalizeRecoveryCode(input);
      if (!code)
        throw new Error("Enter all 20 letters and numbers of your code.");
      const user = signedIn();
      online("check your recovery code");
      const vault = await fetchVault(user.id);
      if (!vault) throw new Error("There is no journal in your account.");
      try {
        await unwrapDataKey(code, vault.recovery_salt, vault.recovery_key);
      } catch {
        throw new Error("That code does not match. Please check it.");
      }
      await patch({
        codeCheckedAt: Date.now(),
        codeCheckSnoozedUntil: undefined,
      });
    },
    snoozeCodeCheck: () =>
      patch({ codeCheckSnoozedUntil: Date.now() + 30 * day }),
    acknowledgeRecoveryCode: () =>
      set({ recoveryCode: null, recoveryReason: null }),
    forget: async () => {
      const user = signedIn();
      online("clear your journal");
      await clearPrivateEntries(user.id);
      await clearNativeKey();
      await db.pending
        .where("userId")
        .equals(user.id)
        .filter((item) => item.table !== "flee_logs")
        .delete();
      await db.security.clear();
      set({ security: null, hasVault: false, key: null });
    },
  };
});
export function journalKey() {
  const key = usePrivacy.getState().key;
  if (!key) throw new Error("Unlock your journal first.");
  return key;
}
