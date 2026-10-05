import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { PinInput } from "../components/PinInput";
import { usePrivacy } from "../state/privacy";
// Once a year (or whenever the user asks) he types his recovery code to be
// sure he still has it. If he cannot find it, he makes a new one while his
// journal still opens, instead of finding out on a new phone.
const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  (
    e.currentTarget.querySelector("button.primary") as HTMLButtonElement | null
  )?.click();
};
export default function RecoveryCheckScreen() {
  const { checkRecoveryCode, snoozeCodeCheck, replaceRecoveryCode } =
    usePrivacy();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [lost, setLost] = useState(false);
  const [checked, setChecked] = useState(false);
  const back = { to: "/privacy", label: "Privacy" };
  if (checked)
    return (
      <Page title="Your code is right" back={back}>
        <p>
          Your recovery code still opens your journal. Keep it where it is, safe
          and apart from your phone.
        </p>
        <Link className="button primary block" to="/">
          Return home
        </Link>
      </Page>
    );
  if (lost)
    return (
      <Page
        title="Make a new recovery code"
        back={back}
        lede="Your journal still opens on this phone, so you can make a new code now. Your old code will stop working."
      >
        <form onSubmit={submit}>
          <PinInput
            label="Confirm with your PIN"
            value={pin}
            onChange={setPin}
            autoFocus
          />
          <div className="stack">
            <Action className="primary" run={() => replaceRecoveryCode(pin)}>
              Make a new recovery code
            </Action>
            <button
              type="button"
              className="quiet"
              onClick={() => setLost(false)}
            >
              Go back
            </button>
          </div>
        </form>
      </Page>
    );
  return (
    <Page
      title="Do you still have your recovery code?"
      back={back}
      lede="You need it to open your journal on a new phone, or if you forget your PIN. Type it here to be sure it still works."
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
        <div className="stack">
          <Action
            className="primary"
            run={async () => {
              await checkRecoveryCode(code);
              setChecked(true);
            }}
          >
            Check my code
          </Action>
          <button type="button" onClick={() => setLost(true)}>
            I cannot find my code
          </button>
        </div>
      </form>
      <Action
        className="quiet"
        run={async () => {
          await snoozeCodeCheck();
          navigate("/", { replace: true });
        }}
      >
        Remind me later
      </Action>
    </Page>
  );
}
