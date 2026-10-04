import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { OnboardingBar } from "../components/Steps";
import { cloud, result, supabase } from "../brethren/client";
import { useAuth } from "../state/auth";
import { usePreferences } from "../state/preferences";
// Sign-in uses a code typed into the app. On iPhone an installed web app cannot
// receive a tapped email link; the link would open Safari instead.
export default function SignInScreen() {
  const user = useAuth((s) => s.user);
  const onboarded = usePreferences((s) => s.value.onboarded);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  if (user)
    return <Navigate to={onboarded ? "/" : "/onboarding/trust"} replace />;
  const send = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      throw new Error("Enter your email address.");
    if (!navigator.onLine)
      throw new Error("Connect to the internet to sign in.");
    await result(
      cloud().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}`,
        },
      }),
    );
    setSent(true);
  };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    (
      e.currentTarget.querySelector(
        "button.primary",
      ) as HTMLButtonElement | null
    )?.click();
  };
  return (
    <Page
      bare
      title={sent ? "Check your email" : "Your account"}
      lede={
        sent
          ? `We sent a code to ${email.trim()}. Type it here to continue.`
          : "Your account keeps your battles, times and journal safe if you change phones. Your journal is encrypted with a PIN you choose next, so only you can read it."
      }
      bar={<OnboardingBar step={1} />}
    >
      {!supabase ? (
        <p className="notice">
          Mortify cannot reach its server right now. Please try again later.
        </p>
      ) : sent ? (
        <form className="card fade" onSubmit={submit}>
          <label style={{ marginTop: 0 }}>
            Code from the email
            <input
              className="pin-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={token}
              autoFocus
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div className="stack">
            <Action
              className="primary"
              run={async () => {
                if (token.length < 6)
                  throw new Error("Enter the code from the email.");
                await result(
                  cloud().auth.verifyOtp({
                    email: email.trim(),
                    token,
                    type: "email",
                  }),
                );
              }}
            >
              Continue
            </Action>
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <Action className="quiet" run={send}>
              Send a new code
            </Action>
            <button
              type="button"
              className="quiet"
              onClick={() => {
                setSent(false);
                setToken("");
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={submit}>
          <label style={{ marginTop: 0 }}>
            Email
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <div className="stack">
            <Action className="primary" run={send}>
              Email me a code
            </Action>
          </div>
          <p className="hint" style={{ marginTop: 14 }}>
            <Icon name="mail" size={16} />
            New here or returning, this same step signs you in.
          </p>
        </form>
      )}
    </Page>
  );
}
