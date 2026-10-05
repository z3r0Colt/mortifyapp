import {
  decryptText,
  encryptText,
  fromBase64,
  toBase64,
  type CipherText,
} from "./crypto";
// Fingerprint or face unlock for the web app. A passkey on this phone is used
// only as a lock: after the phone checks the fingerprint or face, its PRF
// extension returns a secret, and that secret locks a copy of the journal key
// kept on this phone. No passkey or secret is ever sent to the server.
export type Passkey = {
  credentialId: string;
  salt: string;
  wrapped: CipherText;
};
const random = (length: number) =>
  crypto.getRandomValues(new Uint8Array(length));
/** True when this browser can likely make a passkey that unlocks Mortify. */
export async function passkeyAvailable() {
  if (typeof PublicKeyCredential === "undefined" || !window.isSecureContext)
    return false;
  try {
    const capabilities = await PublicKeyCredential.getClientCapabilities?.();
    if (capabilities && capabilities["extension:prf"] === false) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
async function lockFrom(secret: BufferSource) {
  const base = await crypto.subtle.importKey("raw", secret, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(),
      info: new TextEncoder().encode("Mortify journal key"),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
const unsupported =
  "This phone cannot unlock Mortify with a fingerprint or face. Keep using your PIN.";
async function evaluate(credentialId: string, salt: string) {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: random(32),
      allowCredentials: [{ type: "public-key", id: fromBase64(credentialId) }],
      userVerification: "required",
      timeout: 60000,
      extensions: { prf: { eval: { first: fromBase64(salt) } } },
    },
  })) as PublicKeyCredential | null;
  const secret = assertion?.getClientExtensionResults().prf?.results?.first;
  if (!secret) throw new Error(unsupported);
  return lockFrom(secret);
}
/** Makes a passkey on this phone and locks the raw journal key with it. */
export async function enrollPasskey(raw: string): Promise<Passkey> {
  const salt = toBase64(random(32));
  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { name: "Mortify" },
      user: {
        id: random(16),
        name: "Mortify journal",
        displayName: "Mortify journal",
      },
      challenge: random(32),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60000,
      extensions: { prf: { eval: { first: fromBase64(salt) } } },
    },
  })) as PublicKeyCredential | null;
  const prf = credential?.getClientExtensionResults().prf;
  if (!credential || !prf?.enabled) throw new Error(unsupported);
  const credentialId = toBase64(new Uint8Array(credential.rawId));
  // Some phones give the secret at once; others need one more check.
  const lock = prf.results?.first
    ? await lockFrom(prf.results.first)
    : await evaluate(credentialId, salt);
  return { credentialId, salt, wrapped: await encryptText(lock, raw) };
}
/** Returns the raw journal key after the phone checks the fingerprint or face. */
export async function unlockWithPasskey(passkey: Passkey) {
  return decryptText(
    await evaluate(passkey.credentialId, passkey.salt),
    passkey.wrapped,
  );
}
