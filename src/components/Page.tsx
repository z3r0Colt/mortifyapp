import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";
/** The Mortify logo: a cross on the mountain within a circle. */
export function Mark({ large = false }: { large?: boolean }) {
  return (
    <img
      className={`mark${large ? " large" : ""}`}
      src={`${import.meta.env.BASE_URL}logo-128.png`}
      alt=""
      width={large ? 64 : 30}
      height={large ? 64 : 30}
    />
  );
}
export function Brand() {
  return (
    <span className="brand">
      <Mark />
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
  className,
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
  className?: string;
}) {
  return (
    <main
      className={`page${calm ? " no-animation" : ""}${bare ? " bare" : ""}${className ? ` ${className}` : ""}`}
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
