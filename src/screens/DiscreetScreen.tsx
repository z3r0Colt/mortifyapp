import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { isNative, nativePlatform } from "../native/platform";
import { setDiscreet } from "../native/discreet";
import { db } from "../data/db";
export default function DiscreetScreen() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    void db.cloudKv
      .get("discreet-icon")
      .then((row) => setEnabled(row?.value === "on"));
  }, []);
  return (
    <Page title="Discreet icon">
      {isNative() ? (
        <>
          <p>
            {nativePlatform() === "android"
              ? "Use a plain Notes icon and launcher name on this phone."
              : "Use a plain Notes icon. iPhone keeps the installed app name Mortify; iOS does not let an app change its name at runtime."}
          </p>
          <p>The icon may take a moment to change on your home screen.</p>
          <Action
            run={async () => {
              await setDiscreet(!enabled);
              setEnabled(!enabled);
            }}
          >
            {enabled ? "Use Mortify icon" : "Use Notes icon"}
          </Action>
        </>
      ) : (
        <p>A discreet launcher icon is available in the native apps.</p>
      )}
    </Page>
  );
}
