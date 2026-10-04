import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useBattlePacks } from "../content/selection";
import { usePreferences } from "../state/preferences";
import { devicePlatform } from "../platform";
import { queueEvent } from "../brethren/outbox";
import { NativeProtectionCard } from "../components/NativeProtectionCard";
import { isNative } from "../native/platform";
import { shieldStatus } from "../native/protection";
export default function ProtectionScreen() {
  const packs = useBattlePacks();
  const { value, save } = usePreferences();
  const [platform, setPlatform] = useState(
    devicePlatform() === "ios" ? "ios" : "android",
  );
  const [checked, setChecked] = useState(value.protectionEnabled ?? false);
  const [guide, setGuide] = useState(!isNative());
  const [nativeAvailable, setNativeAvailable] = useState(false);
  useEffect(() => {
    void shieldStatus().then((status) =>
      setNativeAvailable(status?.available ?? false),
    );
  }, []);
  if (!packs.some((p) => p.screenBased))
    return (
      <Page title="Protection setup">
        <p>
          This guide appears for screen based battles. Your chosen battles do
          not need this setup.
        </p>
      </Page>
    );
  return (
    <Page title="Guard occasions of sin">
      <NativeProtectionCard />
      {isNative() && (
        <button onClick={() => setGuide(!guide)}>
          {guide ? "Close setup guide" : "Open fallback setup guide"}
        </button>
      )}
      {guide && (
        <>
          <p>
            Mortify on the web cannot filter your phone's internet. Set
            protection in your phone's settings, and ask a trusted believer to
            help you keep it in place.
          </p>
          <div className="row">
            <button
              aria-pressed={platform === "android"}
              onClick={() => setPlatform("android")}
            >
              Android
            </button>
            <button
              aria-pressed={platform === "ios"}
              onClick={() => setPlatform("ios")}
            >
              iPhone
            </button>
          </div>
          {platform === "android" ? (
            <>
              <ol>
                <li>
                  Open Android Settings and search for Private DNS (Android 9 or
                  later).
                </li>
                <li>Choose Private DNS provider hostname.</li>
                <li>
                  Enter <code>family-filter-dns.cleanbrowsing.org</code> and
                  save.
                </li>
                <li>
                  Check that filtering works on both mobile data and Wi-Fi.
                  Review your browser's Secure DNS settings so they do not
                  override it.
                </li>
              </ol>
              <a
                href="https://cleanbrowsing.org/support/mobile/android-private-dns"
                target="_blank"
                rel="noreferrer"
              >
                CleanBrowsing setup guide
              </a>
            </>
          ) : (
            <>
              <ol>
                <li>Open Settings, then Screen Time.</li>
                <li>Turn on Content &amp; Privacy Restrictions.</li>
                <li>
                  Open App Store, Media, Web &amp; Games (or Content
                  Restrictions on older versions), then Web Content.
                </li>
                <li>Choose Limit Adult Websites.</li>
                <li>
                  Ask your spouse or a trusted sister or brother to keep the
                  Screen Time passcode.
                </li>
                <li>
                  Check the restriction in Safari and the other browsers you
                  use.
                </li>
              </ol>
              <a
                href="https://support.apple.com/en-us/105121"
                target="_blank"
                rel="noreferrer"
              >
                Apple's Screen Time guide
              </a>
            </>
          )}
          {!nativeAvailable && (
            <>
              <label className="row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                My protection is set up
              </label>
              <Action
                run={async () => {
                  await save({
                    protectionEnabled: checked,
                    protectionCheckedAt: checked ? Date.now() : undefined,
                  });
                  if (checked !== value.protectionEnabled)
                    await queueEvent(checked ? "blocker_on" : "blocker_off");
                }}
              >
                Save protection status
              </Action>
              <p className="label">
                This records your confirmation. The web app cannot check your
                phone's settings.
              </p>
            </>
          )}
        </>
      )}
    </Page>
  );
}
