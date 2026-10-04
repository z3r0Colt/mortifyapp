import { Link } from "react-router-dom";
import { useBattlePacks } from "../content/selection";
import { usePreferences } from "../state/preferences";
export function ProtectionReminder() {
  const screenBased = useBattlePacks().some((p) => p.screenBased);
  const value = usePreferences((s) => s.value);
  if (
    !screenBased ||
    (value.protectionEnabled &&
      value.protectionCheckedAt &&
      Date.now() - value.protectionCheckedAt < 30 * 86400000)
  )
    return null;
  return (
    <article className="card">
      <h2>Check your protection</h2>
      <p>
        {value.protectionEnabled
          ? "Please check that your phone’s protection is still on."
          : "Make time to set up your phone’s protection with a trusted believer."}
      </p>
      <Link to="/protection">Open protection setup</Link>
    </article>
  );
}
