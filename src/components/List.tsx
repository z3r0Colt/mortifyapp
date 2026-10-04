import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
export function ListGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <>
      {title && <h2 className="section-title">{title}</h2>}
      <ul className="list">{children}</ul>
    </>
  );
}
export function ListLink({
  to,
  icon,
  label,
  detail,
  end,
}: {
  to: string;
  icon: IconName;
  label: ReactNode;
  detail?: ReactNode;
  /** Extra content shown before the chevron, such as an unread count. */
  end?: ReactNode;
}) {
  return (
    <li>
      <Link className="list-row" to={to}>
        <span className="tile">
          <Icon name={icon} size={20} />
        </span>
        <span className="row-text">
          {label}
          {detail && <span className="row-detail">{detail}</span>}
        </span>
        {end}
        <Icon name="chevron" size={18} className="chevron" />
      </Link>
    </li>
  );
}
/** An on/off setting that always shows its current state. */
export function SwitchRow({
  label,
  detail,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  detail?: ReactNode;
  /** Undefined while the current state is still loading. */
  checked: boolean | undefined;
  disabled?: boolean;
  onChange: (next: boolean) => Promise<unknown>;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <li>
      <div className="list-row switch-row">
        <span className="row-text">
          <span id={id}>{label}</span>
          {detail && <span className="row-detail">{detail}</span>}
        </span>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={!!checked}
          aria-labelledby={id}
          disabled={busy || disabled || checked === undefined}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onChange(!checked);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Could not save. Please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {error && (
        <p role="alert" className="row-error">
          {error}
        </p>
      )}
    </li>
  );
}
