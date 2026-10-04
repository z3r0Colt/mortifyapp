import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { usePrivacy } from "../state/privacy";
export default function PinScreen() {
  const { security, setup, unlock, forget, unlockBiometric } = usePrivacy();
  const [pin, setPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [forgot, setForgot] = useState(false);
  return (
    <Page
      title={
        forgot
          ? "Forgotten PIN"
          : security
            ? "Open your study"
            : "Keep your journal private"
      }
    >
      {forgot ? (
        <>
          <p>
            Without your PIN, your encrypted journal and confessions cannot be
            recovered. You may clear them and choose a new PIN. Your selected
            battles and reading times remain.
          </p>
          <Action
            run={async () => {
              if (
                window.confirm(
                  "Permanently clear all journal entries and confessions on this device?",
                )
              ) {
                await forget();
                setForgot(false);
                setPin("");
              }
            }}
          >
            Clear journal and choose a new PIN
          </Action>
          <button onClick={() => setForgot(false)}>Go back</button>
        </>
      ) : (
        <>
          <p>
            {security
              ? "Enter your PIN to continue."
              : "Choose a PIN of 6 to 12 digits. Keep it safely: it is needed to open your private text."}
          </p>
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete={security ? "current-password" : "new-password"}
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {!security && (
            <label>
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={12}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value.replace(/\D/g, ""))}
              />
            </label>
          )}
          <Action
            className="primary"
            run={async () => {
              if (security) {
                await unlock(pin);
                setPin("");
              } else {
                if (pin !== repeat) throw new Error("The PINs do not match.");
                await setup(pin);
                setPin("");
                setRepeat("");
              }
            }}
          >
            {security ? "Open Mortify" : "Set PIN"}
          </Action>
          {security?.biometricEnabled && (
            <Action run={unlockBiometric}>
              Open with fingerprint or Face ID
            </Action>
          )}
          {security && (
            <button className="quiet" onClick={() => setForgot(true)}>
              I have forgotten my PIN
            </button>
          )}
        </>
      )}
    </Page>
  );
}
