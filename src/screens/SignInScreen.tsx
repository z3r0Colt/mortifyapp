import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { cloud, result, supabase } from "../brethren/client";
export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  return (
    <Page
      title="Sign in for brethren"
      lede={
        supabase
          ? "Sign in by email to link with believers you already know. Your private journal stays on this device."
          : undefined
      }
    >
      {supabase ? (
        <div className="card">
          <label>
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
