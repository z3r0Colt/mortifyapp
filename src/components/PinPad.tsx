import type { ReactNode } from "react";
import { Icon } from "./Icon";
// A phone-style number pad over a real PIN field. The field keeps the label
// for screen readers and takes a physical keyboard; inputMode "none" stops the
// phone's own keyboard from covering the pad.
export function PinPad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  corner,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** Fills the empty key beside 0, as a phone puts Emergency there. */
  corner?: ReactNode;
}) {
  const press = (digit: string) => {
    if (value.length < 12) onChange(value + digit);
  };
  return (
    <>
      <label className="pin-field">
        <span className="visually-hidden">PIN</span>
        <input
          className="pin-hidden"
          type="text"
          inputMode="none"
          maxLength={12}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
          autoFocus
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
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
          onClick={() => onChange(value.slice(0, -1))}
        >
          <Icon name="back" size={24} />
        </button>
      </div>
    </>
  );
}
