import type { ReactNode } from "react";
export function Page({
  title,
  children,
  calm = false,
}: {
  title: string;
  children: ReactNode;
  calm?: boolean;
}) {
  return (
    <main className={`page${calm ? " no-animation" : ""}`}>
      <p className="eyebrow">Mortify</p>
      <h1>{title}</h1>
      {children}
      <footer>
        Look to Christ. Turn to the Word and prayer, and seek the care of your
        local church.
      </footer>
    </main>
  );
}
