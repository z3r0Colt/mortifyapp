import { useState, type FormEvent } from "react";
import { Mark, Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { PinInput } from "../components/PinInput";
import { usePrivacy } from "../state/privacy";
type Mode = "pin" | "recover" | "reset";
// Enter submits through the form's primary button so its errors still show.
const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  (
    e.currentTarget.querySelector("button.primary") as HTMLButtonElement | null
  )?.click();
};
export default function PinScreen() {
  const {
    security,
    hasVault,
    setup,
    unlock,
    recover,
    forget,
    unlockBiometric,
  } = usePrivacy();
  const [mode, setMode] = useState<Mode>("pin");
  const [pin, setPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const reset = (next: Mode) => {
    setMode(next);
    setPin("");
    setRepeat("");
    setCode("");
  };
  const mark = <Mark large />;
  // A PIN belongs to one phone. On a new phone the journal is opened once with
  // the recovery code, and then this phone gets a PIN of its own.
  const newPhone = !security && hasVault;
  if (mode === "recover" || (newPhone && mode === "pin"))
    return (
      <Page
        bare
        title={newPhone ? "Open your journal on this phone" : "Forgotten PIN"}
        lede={
          newPhone
            ? "Enter the recovery code you wrote down when you first set your PIN, then choose a PIN for this phone. Your journal stays as it is."
            : "Enter the recovery code you wrote down when you set your PIN, then choose a new PIN. Your journal stays as it is."
        }
        bar={mark}
      >
        <form onSubmit={submit}>
          <label>
            Recovery code
            <input
              className="code-input recovery-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              data-form-type="other"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          <PinInput
            label={newPhone ? "PIN for this phone" : "New PIN"}
            value={pin}
            onChange={setPin}
          />
          <PinInput
            label={newPhone ? "Confirm PIN" : "Confirm new PIN"}
            value={repeat}
            onChange={setRepeat}
          />
          <div className="stack">
            <Action
              className="primary"
              run={async () => {
                if (pin !== repeat) throw new Error("The PINs do not match.");
                await recover(code, pin);
              }}
            >
              {newPhone ? "Open my journal" : "Set new PIN"}
            </Action>
            {!newPhone && (
              <button
                type="button"
                className="quiet"
                onClick={() => reset("pin")}
              >
                Go back
              </button>
            )}
          </div>
        </form>
        <button className="quiet" onClick={() => reset("reset")}>
          I do not have my recovery code
        </button>
      </Page>
    );
  if (mode === "reset")
    return (
      <Page bare title="Start your journal again" bar={mark}>
        <p className="notice">
          Without your PIN or recovery code, your journal and confessions cannot
          be opened by anyone. You may clear them from your account and choose a
          new PIN. Your battles, times and brethren remain.
        </p>
        <p>
          If your journal still opens on another phone, you can make a new
          recovery code there instead, under Settings › Privacy, PIN, and your
          data.
        </p>
        <div className="stack">
          <Action
            run={async () => {
              if (
                window.confirm(
                  "Permanently clear all journal entries and confessions from your account?",
                )
              ) {
                await forget();
                reset("pin");
              }
            }}
          >
            Clear journal and choose a new PIN
          </Action>
          <button className="quiet" onClick={() => reset("recover")}>
            Go back
          </button>
        </div>
      </Page>
    );
  return (
    <Page
      bare
      title={security ? "Open your study" : "Keep your journal private"}
      lede={
        security
          ? "Enter your PIN to continue."
          : "Choose a PIN of 6 to 12 digits. Your journal is encrypted with it before it leaves this phone, so only you can read it."
      }
      bar={mark}
    >
      <form onSubmit={submit}>
        <PinInput label="PIN" value={pin} onChange={setPin} autoFocus />
        {!security && (
          <PinInput label="Confirm PIN" value={repeat} onChange={setRepeat} />
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
            onClick={() => reset("recover")}
          >
            I have forgotten my PIN
          </button>
        ) : (
          <p className="hint" style={{ marginTop: 16 }}>
            <Icon name="lock" size={16} />
            Next you will get a recovery code in case you ever forget it.
          </p>
        )}
      </form>
    </Page>
  );
}
