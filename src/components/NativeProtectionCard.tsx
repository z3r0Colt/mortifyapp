import { useEffect, useState } from "react";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { isNative, nativePlatform } from "../native/platform";
import {
  shieldStatus,
  startShield,
  stopShield,
  type ShieldStatus,
} from "../native/protection";
export function NativeProtectionCard() {
  const [status, setStatus] = useState<ShieldStatus | null>(null);
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    void shieldStatus().then(setStatus);
  }, []);
  if (!isNative()) return null;
  return (
    <article className="card">
      <div className="person" style={{ marginBottom: 14 }}>
        <span className="tile">
          <Icon name="shield" size={20} />
        </span>
        <span className="row-text">
          <strong>Phone protection</strong>
          {status?.available && (
            <span className={`status-pill${status.running ? " on" : ""}`}>
              Protection is {status.running ? "on" : "off"}
            </span>
          )}
        </span>
      </div>
      {status?.available ? (
        <>
          <p>
            {nativePlatform() === "android"
              ? "Mortify uses a local VPN to filter DNS and keep SafeSearch on. Internet packets are forwarded on this phone. DNS questions go over an encrypted connection to CleanBrowsing’s family filter. Mortify does not keep your browsing history. Only protection on/off status is shared with accepted brethren if you enable that choice."
              : "Apple authorization lets Mortify apply the adult web content filter. You control permission in Settings."}
          </p>
          {!status.running && (
            <label className="row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I understand and want to enable protection.
            </label>
          )}
          {status.running ? (
            <Action
              run={async () => {
                setStatus(await stopShield());
              }}
            >
              Turn off protection
            </Action>
          ) : (
            consent && (
              <Action
                className="primary"
                run={async () => {
                  setStatus(await startShield());
                }}
              >
                Turn on protection
              </Action>
            )
          )}
          {nativePlatform() === "android" && (
            <p className="label" style={{ marginTop: 16 }}>
              After testing this build, open Android Settings, find VPN, tap
              Mortify's settings, turn on Always-on VPN, then Block connections
              without VPN. If another VPN is in use, Android will ask you to
              choose one.
            </p>
          )}
        </>
      ) : (
        <p>
          Native filtering is not available in this build. Use the setup guide
          below.
        </p>
      )}
    </article>
  );
}
