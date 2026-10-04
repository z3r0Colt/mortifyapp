import { it, expect } from "vitest";
import {
  deriveKey,
  newSalt,
  encryptText,
  decryptText,
  fromBase64,
  toBase64,
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
