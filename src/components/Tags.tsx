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
    <fieldset className="card">
      <legend>{title}</legend>
      {options.map((tag) => (
        <label className="row" key={tag}>
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
          {tag}
        </label>
      ))}
    </fieldset>
  );
}
