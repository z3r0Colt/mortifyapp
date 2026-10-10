import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mark, Page } from "../components/Page";
import { Action } from "../components/Action";
import { ActionForm } from "../components/ActionForm";
import { Icon } from "../components/Icon";
import { PinInput } from "../components/PinInput";
import { OnboardingBar } from "../components/Steps";
import { PinPad } from "../components/PinPad";
import { usePrivacy, waitText } from "../state/privacy";
import { useCircleWords } from "../brethren/words";
import { signOut } from "../brethren/account";
type Mode = "pin" | "recover" | "reset";
export default function PinScreen() {
  const { circle } = useCircleWords();
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
  // Flee needs no PIN, so it is offered wherever one is asked for.
  const flee = (
    <Link className="button block" to="/flee">
      <Icon name="exit" size={18} />
      In temptation? Flee
    </Link>
  );
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
        <ActionForm>
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
        </ActionForm>
        <button className="quiet" onClick={() => reset("reset")}>
          I do not have my recovery code
        </button>
        {newPhone && (
          <Action className="quiet" run={signOut}>
            Use a different account
          </Action>
        )}
        {newPhone && flee}
      </Page>
    );
  if (mode === "reset")
    return (
      <Page bare title="Start your journal again" bar={mark}>
        <p className="notice">
          Without your PIN or recovery code, your journal and confessions cannot
          be opened by anyone. You may clear them from your account and choose a
          new PIN. Your battles, times and {circle} remain.
        </p>
        <p>
          If your journal still opens on another phone, you can make a new
          recovery code there instead, under Settings › Recovery code.
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
  if (security) return <LockView onForgot={() => reset("recover")} />;
  return (
    <Page
      bare
      title="Keep your journal private"
      lede="Choose a PIN of 6 to 12 digits. Your journal is encrypted with it before it leaves this phone, so only you can read it."
      bar={<OnboardingBar step={6} />}
    >
      <ActionForm>
        <PinInput label="PIN" value={pin} onChange={setPin} autoFocus />
        <PinInput label="Confirm PIN" value={repeat} onChange={setRepeat} />
        <div className="stack">
          <Action
            className="primary"
            run={async () => {
              if (pin !== repeat) throw new Error("The PINs do not match.");
              await setup(pin);
              setPin("");
              setRepeat("");
            }}
          >
            Set PIN
          </Action>
        </div>
        <p className="hint" style={{ marginTop: 16 }}>
          <Icon name="lock" size={16} />
          Next you will get a recovery code in case you ever forget it.
        </p>
      </ActionForm>
    </Page>
  );
}
// The everyday lock screen: the app, then either the number pad or, when this
// phone opens with a fingerprint or face, a single Open Mortify button.
function LockView({ onForgot }: { onForgot: () => void }) {
  const { security, unlock, unlockBiometric } = usePrivacy();
  const biometric = !!security?.biometricEnabled;
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(!biometric);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const wait = Math.max(0, (security?.lockedUntil ?? 0) - now);
  useEffect(() => {
    if (!wait) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [wait > 0]);
  const open = async (entered = pin) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (usePin) {
        if (entered.length < 6) throw new Error("Enter your PIN.");
        await unlock(entered);
      } else await unlockBiometric();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mortify did not open.");
      if (usePin) setPin("");
      else setFailed(true);
      setNow(Date.now());
    } finally {
      setBusy(false);
    }
  };
  const flee = (
    <Link className="keypad-word" to="/flee">
      Flee
    </Link>
  );
  return (
    <main className="lock fade">
      <div className="lock-head">
        <Mark large />
        <h1>Mortify</h1>
        <p className="lock-status" role="status">
          {wait
            ? `Too many tries. Try again in ${waitText(wait)}.`
            : error ||
              (usePin
                ? "Enter your PIN"
                : "Locked with your fingerprint or face")}
        </p>
      </div>
      {usePin ? (
        <div className="lock-pad">
          <PinPad
            value={pin}
            onChange={(next) => {
              setPin(next);
              setError("");
              // Opens on the last digit, as a phone's own lock screen does.
              if (security?.pinLength && next.length === security.pinLength)
                void open(next);
            }}
            onSubmit={() => void open()}
            disabled={!!wait || busy}
            corner={flee}
          />
        </div>
      ) : (
        <div className="lock-pad lock-spacer" />
      )}
      <div className="lock-actions">
        <button
          className="primary"
          aria-busy={busy}
          disabled={busy || (usePin && !!wait)}
          onClick={() => void open()}
        >
          Open Mortify
        </button>
        {usePin && biometric && (
          <button
            className="quiet"
            onClick={() => {
              setUsePin(false);
              setError("");
            }}
          >
            Use my fingerprint or face
          </button>
        )}
        {!usePin && failed && (
          <button
            className="quiet"
            onClick={() => {
              setUsePin(true);
              setError("");
            }}
          >
            Use my PIN instead
          </button>
        )}
        {usePin && (
          <button className="quiet" onClick={onForgot}>
            I have forgotten my PIN
          </button>
        )}
        {!usePin && (
          <Link className="lock-flee" to="/flee">
            In temptation? Flee
          </Link>
        )}
      </div>
    </main>
  );
}
