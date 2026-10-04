import { useState, type ReactNode } from "react";
export function Action({
  run,
  children,
  className,
  checked,
}: {
  run: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
  checked?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        role={checked === undefined ? undefined : "switch"}
        aria-checked={checked}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await run();
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
      >
        {busy ? "Please wait…" : children}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
