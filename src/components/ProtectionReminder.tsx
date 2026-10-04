import { Link } from "react-router-dom";
import { useBattlePacks } from "../content/selection";
import { usePreferences } from "../state/preferences";
import { Icon } from "./Icon";
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
    <Link className="card person" to="/protection">
      <span className="tile">
        <Icon name="shield" size={20} />
      </span>
      <span className="row-text">
        <strong>Check your protection</strong>
        <span>
          {value.protectionEnabled
            ? "Please check that your phone’s protection is still on."
            : "Make time to set up your phone’s protection with a trusted believer."}
        </span>
      </span>
      <Icon name="chevron" size={18} className="chevron" />
    </Link>
  );
}
