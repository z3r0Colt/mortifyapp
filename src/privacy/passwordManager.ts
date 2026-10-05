import { isNative } from "../native/platform";
// Chrome (on Android and computers) can offer to keep the recovery code in its
// password manager. Safari and the phone apps cannot, so the button is hidden.
type PasswordCredentialInit = { id: string; password: string; name?: string };
type PasswordCredentialType = new (init: PasswordCredentialInit) => Credential;
const passwordCredential = () =>
  (globalThis as { PasswordCredential?: PasswordCredentialType })
    .PasswordCredential;
export function canSaveToPasswordManager() {
  return (
    !isNative() && !!passwordCredential() && !!navigator.credentials?.store
  );
}
/** Asks the browser to save the code. The browser shows its own prompt. */
export async function saveToPasswordManager(account: string, code: string) {
  const Password = passwordCredential();
  if (!Password) return;
  await navigator.credentials.store(
    new Password({
      id: account,
      password: code,
      name: "Mortify recovery code",
    }),
  );
}
