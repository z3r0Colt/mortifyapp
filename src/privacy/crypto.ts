export type CipherText = { v: 1; iv: string; data: string };
export const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));
export const fromBase64 = (text: string) =>
  Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
export function newSalt() {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}
export async function deriveKey(pin: string, salt: string, exportable = false) {
  if (!crypto.subtle)
    throw new Error("Private storage needs HTTPS or localhost.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
      iterations: 600000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    exportable,
    ["encrypt", "decrypt"],
  );
}
export async function encryptText(
  key: CryptoKey,
  text: string,
): Promise<CipherText> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text),
  );
  return { v: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}
export async function decryptText(key: CryptoKey, text: CipherText) {
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(text.iv) },
      key,
      fromBase64(text.data),
    ),
  );
}
// The journal is encrypted with a random key. That key is stored only in
// wrapped form: once under the PIN and once under the recovery code, so either
// can open it and the PIN can change without re-encrypting anything.
export function newDataKey() {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)));
}
export function importDataKey(raw: string) {
  return crypto.subtle.importKey(
    "raw",
    fromBase64(raw),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function wrapDataKey(secret: string, salt: string, raw: string) {
  return encryptText(await deriveKey(secret, salt), raw);
}
/** Returns the raw journal key, or throws if the PIN or code is wrong. */
export async function unwrapDataKey(
  secret: string,
  salt: string,
  wrapped: CipherText,
) {
  return decryptText(await deriveKey(secret, salt), wrapped);
}
// No 0/O, 1/I/L or U, so a handwritten code reads back without confusion.
const codeAlphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
/** Twenty characters (about 98 bits), shown as five groups of four. */
export function newRecoveryCode() {
  const chars: string[] = [];
  while (chars.length < 20)
    for (const byte of crypto.getRandomValues(new Uint8Array(32)))
      if (byte < 240 && chars.length < 20)
        chars.push(codeAlphabet[byte % codeAlphabet.length]);
  return chars.join("").match(/.{4}/g)!.join("-");
}
/** Accepts the code however it was typed: any case, spaces or dashes. */
export function normalizeRecoveryCode(input: string) {
  const plain = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return plain.length === 20 ? plain.match(/.{4}/g)!.join("-") : null;
}
