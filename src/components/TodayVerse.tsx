import { Link } from "react-router-dom";
import { useContent } from "../content/useContent";
import { useDailyReading } from "../content/useDaily";
import { loadBible } from "../bible/loader";
import { resolveReference } from "../bible/resolver";
import { Icon } from "./Icon";
// Today's verse from the reading, shown on Home and leading into the full reading.
export function TodayVerse() {
  const { data, error } = useDailyReading();
  const bible = useContent(loadBible);
  if (error || bible.error) return null;
  let text = "";
  if (data && bible.data)
    try {
      text = resolveReference(bible.data, data.verse).text;
    } catch {
      return null;
    }
  return (
    <Link className="card verse-card" to="/reading">
      <p className="eyebrow">Today's Word</p>
      {text ? (
        <div className="fade">
          <p className="verse-text">{text}</p>
          <div className="card-foot">
            <span className="reference">{data!.verse}</span>
            <span className="label">
              Today's reading <Icon name="chevron" size={14} />
            </span>
          </div>
        </div>
      ) : (
        <p className="verse-text label" role="status">
          Opening Scripture…
        </p>
      )}
    </Link>
  );
}
