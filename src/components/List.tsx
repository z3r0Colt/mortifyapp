import type { ReactNode } from "react";
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
