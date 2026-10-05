import { it, expect } from "vitest";
import {
  deriveKey,
  newSalt,
  encryptText,
  decryptText,
  fromBase64,
  toBase64,
  newDataKey,
  wrapDataKey,
  unwrapDataKey,
  newRecoveryCode,
  normalizeRecoveryCode,
} from "./crypto";
it("decrypts with the original PIN but rejects the wrong PIN and tampering", async () => {
  const salt = newSalt();
  const key = await deriveKey("123456", salt);
  const secret = await encryptText(key, "private confession");
  expect(secret.data).not.toContain("private");
  expect(await decryptText(await deriveKey("123456", salt), secret)).toBe(
    "private confession",
  );
  await expect(
    decryptText(await deriveKey("654321", salt), secret),
  ).rejects.toThrow();
  const bytes = fromBase64(secret.data);
  bytes[0] ^= 1;
  await expect(
    decryptText(key, { ...secret, data: toBase64(bytes) }),
  ).rejects.toThrow();
});
it("uses a fresh nonce for every encrypted field", async () => {
  const key = await deriveKey("123456", newSalt());
  const a = await encryptText(key, "same");
  const b = await encryptText(key, "same");
  expect(a.iv).not.toBe(b.iv);
  expect(a.data).not.toBe(b.data);
});
it("opens the journal key with the PIN or the recovery code, never a wrong one", async () => {
  const raw = newDataKey();
  const pinSalt = newSalt();
  const codeSalt = newSalt();
  const code = newRecoveryCode();
  const byPin = await wrapDataKey("123456", pinSalt, raw);
  const byCode = await wrapDataKey(code, codeSalt, raw);
  expect(JSON.stringify([byPin, byCode])).not.toContain(raw);
  expect(await unwrapDataKey("123456", pinSalt, byPin)).toBe(raw);
  expect(await unwrapDataKey(code, codeSalt, byCode)).toBe(raw);
  await expect(unwrapDataKey("654321", pinSalt, byPin)).rejects.toThrow();
  await expect(
    unwrapDataKey(newRecoveryCode(), codeSalt, byCode),
  ).rejects.toThrow();
});
it("makes readable recovery codes and accepts them typed loosely", () => {
  const code = newRecoveryCode();
  expect(code).toMatch(/^([A-HJKMNP-TV-Z2-9]{4}-){4}[A-HJKMNP-TV-Z2-9]{4}$/);
  expect(normalizeRecoveryCode(code.toLowerCase().replace(/-/g, " "))).toBe(
    code,
  );
  expect(normalizeRecoveryCode("TOO-SHORT")).toBeNull();
});
