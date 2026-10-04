import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";
export function Brand() {
  return (
    <span className="brand">
      <span className="mark" aria-hidden="true">
        M
      </span>
      Mortify
    </span>
  );
}
export function Page({
  title,
  children,
  calm = false,
  eyebrow,
  lede,
  back,
  bar,
  bare = false,
}: {
  title: string;
  children: ReactNode;
  calm?: boolean;
  /** Small label above the title. */
  eyebrow?: string;
  /** A sentence under the title. */
  lede?: ReactNode;
  /** A back link shown in the top bar in place of the brand. */
  back?: { to: string; label: string };
  /** Custom top bar content, such as a close button and step progress. */
  bar?: ReactNode;
  /** Pages without the tab bar need less room at the bottom. */
  bare?: boolean;
}) {
  return (
    <main
      className={`page${calm ? " no-animation" : ""}${bare ? " bare" : ""}`}
    >
      <div className="page-bar">
        {bar ??
          (back ? (
            <Link className="back" to={back.to}>
              <Icon name="back" size={20} />
              {back.label}
            </Link>
          ) : (
            <Brand />
          ))}
      </div>
      <header className="page-head">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </header>
      {children}
      <footer>
        Look to Christ. Turn to the Word and prayer, and seek the care of your
        local church.
      </footer>
    </main>
  );
}
