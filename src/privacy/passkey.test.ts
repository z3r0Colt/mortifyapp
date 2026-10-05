import { afterEach, expect, it, vi } from "vitest";
import { enrollPasskey, unlockWithPasskey } from "./passkey";
import { newDataKey } from "./crypto";
// A stand-in for the phone's authenticator: each passkey holds a secret, and
// PRF answers HMAC-SHA256(secret, salt), as real authenticators do.
function fakeAuthenticator({ prf = true, resultsAtCreate = false } = {}) {
  const secrets = new Map<string, CryptoKey>();
  const prfOf = async (id: string, salt: BufferSource) =>
    crypto.subtle.sign("HMAC", secrets.get(id)!, salt);
  const idOf = (bytes: ArrayBuffer | ArrayBufferView) =>
    Buffer.from(
      bytes instanceof ArrayBuffer
        ? bytes
        : bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
    ).toString("hex");
  return {
    create: vi.fn(async ({ publicKey }: CredentialCreationOptions) => {
      const rawId = crypto.getRandomValues(new Uint8Array(16)).buffer;
      secrets.set(
        idOf(rawId),
        await crypto.subtle.importKey(
          "raw",
          crypto.getRandomValues(new Uint8Array(32)),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        ),
      );
      const first = publicKey!.extensions!.prf!.eval!.first;
      const results =
        prf && resultsAtCreate
          ? { first: await prfOf(idOf(rawId), first) }
          : undefined;
      return {
        rawId,
        getClientExtensionResults: () => ({ prf: { enabled: prf, results } }),
      };
    }),
    get: vi.fn(async ({ publicKey }: CredentialRequestOptions) => {
      const id = idOf(publicKey!.allowCredentials![0].id as Uint8Array);
      const first = await prfOf(id, publicKey!.extensions!.prf!.eval!.first);
      return {
        getClientExtensionResults: () => ({ prf: { results: { first } } }),
      };
    }),
  };
}
afterEach(() => vi.unstubAllGlobals());

it.each([false, true])(
  "locks the journal key with a passkey and opens it again (secret at create: %s)",
  async (resultsAtCreate) => {
    const credentials = fakeAuthenticator({ resultsAtCreate });
    vi.stubGlobal("navigator", { credentials });
    const raw = newDataKey();
    const passkey = await enrollPasskey(raw);
    expect(JSON.stringify(passkey)).not.toContain(raw);
    expect(await unlockWithPasskey(passkey)).toBe(raw);
    // Every check asks the phone to verify the fingerprint or face.
    for (const call of credentials.get.mock.calls)
      expect(call[0].publicKey!.userVerification).toBe("required");
  },
);

it("explains when the phone's passkeys cannot unlock Mortify", async () => {
  vi.stubGlobal("navigator", {
    credentials: fakeAuthenticator({ prf: false }),
  });
  await expect(enrollPasskey(newDataKey())).rejects.toThrow(
    /cannot unlock Mortify with a fingerprint or face/,
  );
});

it("a different passkey cannot open the key", async () => {
  vi.stubGlobal("navigator", { credentials: fakeAuthenticator() });
  const passkey = await enrollPasskey(newDataKey());
  const other = await enrollPasskey(newDataKey());
  await expect(
    unlockWithPasskey({ ...passkey, credentialId: other.credentialId }),
  ).rejects.toThrow();
});
