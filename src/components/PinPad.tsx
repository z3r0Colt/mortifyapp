import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
// A phone-style number pad. The field under the dots keeps the PIN's label
// but is read-only and never focused, because some phones open their own
// keyboard over the pad for any field that is, whatever inputMode says. A
// physical keyboard still types, through the listener below.
export function PinPad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  busy = false,
  corner,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** Checking the PIN: presses are ignored, but the pad does not dim, so it
   *  does not flicker on every try. */
  busy?: boolean;
  /** Fills the empty key beside 0, as a phone puts Emergency there. */
  corner?: ReactNode;
}) {
  const press = (digit: string) => {
    if (!busy && value.length < 12) onChange(value + digit);
  };
  const latest = useRef({ press, value, onChange, onSubmit, disabled, busy });
  latest.current = { press, value, onChange, onSubmit, disabled, busy };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const { press, value, onChange, onSubmit, disabled, busy } =
        latest.current;
      const target = e.target instanceof Element ? e.target : null;
      if (
        disabled ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target?.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace" && !busy) onChange(value.slice(0, -1));
      else if (e.key === "Enter" && !busy && !target?.closest("button, a"))
        onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <label className="pin-field">
        <span className="visually-hidden">PIN</span>
        <input
          className="pin-hidden"
          type="text"
          inputMode="none"
          readOnly
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, "").slice(0, 12))
          }
        />
        <span className="pin-dots" aria-hidden="true">
          {Array.from({ length: Math.max(6, value.length) }, (_, i) => (
            <i key={i} className={i < value.length ? "on" : undefined} />
          ))}
        </span>
      </label>
      <div className="keypad" role="group" aria-label="Number pad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            className="keypad-key"
            disabled={disabled}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        <span className="keypad-corner">{corner}</span>
        <button
          type="button"
          className="keypad-key"
          disabled={disabled}
          onClick={() => press("0")}
        >
          0
        </button>
        <button
          type="button"
          className="keypad-key keypad-plain"
          aria-label="Delete"
          disabled={disabled || !value}
          onClick={() => {
            if (!busy) onChange(value.slice(0, -1));
          }}
        >
          <Icon name="back" size={24} />
        </button>
      </div>
    </>
  );
}
