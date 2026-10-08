import { useEffect, useState } from "react";
import { devicePlatform, isInstalled } from "../platform";
import { db } from "../data/db";
import { usePwa } from "../state/pwa";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { IphoneInstallSteps } from "./NotificationHelp";
import { isNative } from "../native/platform";
export function InstallCard({
  dismissible = false,
}: {
  dismissible?: boolean;
}) {
  const prompt = usePwa((s) => s.installPrompt);
  const installed = usePwa((s) => s.installed) || isInstalled() || isNative();
  const [dismissed, setDismissed] = useState(dismissible);
  useEffect(() => {
    if (dismissible)
      void db.cloudKv
        .get("install-dismissed")
        .then((row) => setDismissed(!!row))
        .catch(() => setDismissed(false));
  }, [dismissible]);
  if (installed || dismissed) return null;
  const ios = devicePlatform() === "ios";
  return (
    <article className="card fade">
      <div className="person" style={{ marginBottom: 12 }}>
        <span className="tile">
          <Icon name="download" size={20} />
        </span>
        <span className="row-text">
          <strong>Add Mortify to your home screen</strong>
        </span>
      </div>
      <p>
        It opens like an app, straight from your home screen.
        {ios && " On iPhone it is also needed for notifications."}
      </p>
      {ios ? (
        <IphoneInstallSteps />
      ) : prompt ? (
        <Action
          className="primary"
          run={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            usePwa.setState({ installPrompt: null });
          }}
        >
          Add to home screen
        </Action>
      ) : (
        <p className="label">
          Open your browser menu and choose Install app or Add to Home Screen.
        </p>
      )}
      {dismissible && (
        <button
          className="quiet"
          onClick={() => {
            setDismissed(true);
            void db.cloudKv
              .put({ key: "install-dismissed", value: "1" })
              .catch(() => {});
          }}
        >
          Not now
        </button>
      )}
    </article>
  );
}
