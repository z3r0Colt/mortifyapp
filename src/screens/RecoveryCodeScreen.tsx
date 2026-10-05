import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mark, Page } from "../components/Page";
import { Icon } from "../components/Icon";
import { usePrivacy } from "../state/privacy";
// Shown once after a PIN is set or a new code is made. The code is never stored.
export default function RecoveryCodeScreen() {
  const { recoveryCode, recoveryReason, acknowledgeRecoveryCode } =
    usePrivacy();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!recoveryCode) return null;
  return (
    <Page
      bare
      title="Your recovery code"
      lede="If you ever forget your PIN, this code is the only way to open your journal. Mortify cannot recover it for you."
      bar={<Mark large />}
    >
      <article className="card accent code-card">
        <p className="eyebrow">Write this down</p>
        <p className="recovery-code" aria-label="Recovery code">
          {recoveryCode}
        </p>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(recoveryCode);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Icon name="share" size={18} />
          {copied ? "Copied" : "Copy code"}
        </button>
      </article>
      <p className="hint">
        <Icon name="lock" size={16} />
        Keep it on paper or in a safe place, apart from your phone.
        {recoveryReason === "new" && " Your old code no longer works."}
      </p>
      <label className="row">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        I have written down my recovery code.
      </label>
      <div className="dock">
        <button
          className="primary"
          disabled={!saved}
          onClick={() => {
            const reason = recoveryReason;
            acknowledgeRecoveryCode();
            navigate(
              reason === "setup" ? "/onboarding/reminders" : "/privacy",
              {
                replace: true,
              },
            );
          }}
        >
          Continue
        </button>
      </div>
    </Page>
  );
}
