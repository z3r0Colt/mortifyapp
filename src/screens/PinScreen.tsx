import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { usePrivacy } from "../state/privacy";
export default function PinScreen() {
  const { security, setup, unlock, forget, unlockBiometric } = usePrivacy();
  const [pin, setPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [forgot, setForgot] = useState(false);
  return (
    <Page
      bare
      title={
        forgot
          ? "Forgotten PIN"
          : security
            ? "Open your study"
            : "Keep your journal private"
      }
      lede={
        forgot
          ? undefined
          : security
            ? "Enter your PIN to continue."
            : "Choose a PIN of 6 to 12 digits. Keep it safely: it is needed to open your private text."
      }
      bar={
        <span className="mark large" aria-hidden="true">
          M
        </span>
      }
    >
      {forgot ? (
        <>
          <p className="notice">
            Without your PIN, your encrypted journal and confessions cannot be
            recovered. You may clear them and choose a new PIN. Your selected
            battles and reading times remain.
          </p>
          <div className="stack">
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
            <button className="quiet" onClick={() => setForgot(false)}>
              Go back
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            (
              e.currentTarget.querySelector(
                "button.primary",
              ) as HTMLButtonElement | null
            )?.click();
          }}
        >
          <label>
            PIN
            <input
              className="pin-input"
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
                className="pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={12}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value.replace(/\D/g, ""))}
              />
            </label>
          )}
          <div className="stack">
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
          </div>
          {security ? (
            <button
              type="button"
              className="quiet"
              onClick={() => setForgot(true)}
            >
              I have forgotten my PIN
            </button>
          ) : (
            <p className="hint">
              <Icon name="lock" size={16} />
              Your journal is encrypted with this PIN on this device.
            </p>
          )}
        </form>
      )}
    </Page>
  );
}
