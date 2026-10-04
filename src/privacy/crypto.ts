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
