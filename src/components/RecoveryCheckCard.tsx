import { Link } from "react-router-dom";
import { codeCheckDue, usePrivacy } from "../state/privacy";
import { Icon } from "./Icon";
// Shown on Home once a year until the user checks his recovery code.
export function RecoveryCheckCard() {
  const security = usePrivacy((s) => s.security);
  if (!codeCheckDue(security)) return null;
  return (
    <Link className="card person" to="/recovery-check">
      <span className="tile">
        <Icon name="lock" size={20} />
      </span>
      <span className="row-text">
        <strong>Check your recovery code</strong>
        <span>
          Make sure you still have the code that opens your journal on a new
          phone.
        </span>
      </span>
      <Icon name="chevron" size={18} className="chevron" />
    </Link>
  );
}
