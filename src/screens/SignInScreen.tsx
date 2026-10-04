import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { cloud, result, supabase } from "../brethren/client";
const points = [
  "A small closed circle of up to eight believers, ideally from your own church.",
  "Brothers link with brothers and sisters with sisters, only by a private code.",
  "No public feed and no strangers.",
  "You choose what they see. Your journal and confessions are never shared.",
];
export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [started, setStarted] = useState(false);
  if (supabase && !started)
    return (
      <Page
        title="Brethren"
        lede="Watch over one another in prayer with a few believers you already know."
      >
        <article className="card">
          <ul className="checks">
            {points.map((point) => (
              <li key={point}>
                <Icon name="check" size={18} />
                {point}
              </li>
            ))}
          </ul>
        </article>
        <div className="stack">
          <button className="primary" onClick={() => setStarted(true)}>
            Sign in to begin
          </button>
        </div>
        <p className="hint" style={{ marginTop: 14 }}>
          Readings, prayer and your journal work without an account.
        </p>
      </Page>
    );
  return (
    <Page
      title="Sign in for brethren"
      lede={
        supabase
          ? "We will email you a sign-in link. Your private journal stays on this device."
          : undefined
      }
    >
      {supabase ? (
        <div className="card">
          <label style={{ marginTop: 0 }}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Action
            className="primary"
            run={async () => {
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
                throw new Error("Enter your email address.");
              await result(
                cloud().auth.signInWithOtp({
                  email,
                  options: {
                    emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}brethren`,
                  },
                }),
              );
              setSent(true);
            }}
          >
            Send sign-in email
          </Action>
          {sent && (
            <div className="fade" style={{ marginTop: 22 }}>
              <p className="notice">
                Check your email for the sign-in link. If your email contains a
                code, you may enter it here.
              </p>
              <label>
                Email code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.trim())}
                />
              </label>
              <Action
                run={() =>
                  result(
                    cloud().auth.verifyOtp({ email, token, type: "email" }),
                  )
                }
              >
                Verify code
              </Action>
            </div>
          )}
        </div>
      ) : (
        <p className="notice">
          The brethren service is not connected yet. Readings, prayer,
          examination and your private journal remain available offline.
        </p>
      )}
    </Page>
  );
}
