import { useId } from "react";
// A masked number field that is not a password field, so browsers and
// password managers do not offer to fill or save it. The data-* attributes
// ask 1Password, LastPass, Bitwarden and Dashlane to leave it alone.
export function PinInput({
  label,
  value,
  onChange,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <label>
      {label}
      <input
        className="pin-input"
        name={`mortify-pin-${id}`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={12}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore=""
        data-lpignore="true"
        data-bwignore=""
        data-form-type="other"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
    </label>
  );
}
