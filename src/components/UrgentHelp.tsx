import type { Pack } from "../content/loader";
import { Icon } from "./Icon";
// A battle's urgent help, such as a crisis line, shown before anything else.
export function UrgentHelp({ pack }: { pack: Pack }) {
  if (!pack.help) return null;
  return (
    <aside className="card accent urgent-help" role="note">
      <p>{pack.help.text}</p>
      <a className="button primary block" href={`tel:${pack.help.call}`}>
        <Icon name="phone" size={18} />
        {pack.help.label}
      </a>
    </aside>
  );
}
