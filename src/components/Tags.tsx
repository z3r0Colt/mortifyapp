import { Icon } from "./Icon";
export function Tags({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="chips">
      <legend>{title}</legend>
      <div className="chip-list">
        {options.map((tag) => (
          <label className="chip" key={tag}>
            <input
              type="checkbox"
              checked={value.includes(tag)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, tag]
                    : value.filter((v) => v !== tag),
                )
              }
            />
            <span className="chip-check">
              <Icon name="check" size={16} />
            </span>
            {tag}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
