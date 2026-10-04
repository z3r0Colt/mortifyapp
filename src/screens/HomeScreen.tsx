import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { Icon } from "../components/Icon";
import { ProtectionReminder } from "../components/ProtectionReminder";
import { TodayVerse } from "../components/TodayVerse";
import { fleeTap } from "../native/haptics";
import { usePreferences } from "../state/preferences";
import { clock } from "../data/clock";
export default function HomeScreen() {
  const { morning, evening } = usePreferences((s) => s.value);
  const now = new Date();
  const day = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const eyebrow =
    now.getDay() === 0
      ? `The Lord's Day · ${day}`
      : `${now.toLocaleDateString(undefined, { weekday: "long" })} · ${day}`;
  return (
    <Page title="Watch and pray" eyebrow={eyebrow}>
      <TodayVerse />
      <Link
        className="flee-card"
        to="/flee"
        onClick={() => {
          void fleeTap();
        }}
      >
        <span className="flee-text">
          <span className="flee-label">In temptation</span>
          <span className="flee-title">Flee</span>
          <span className="flee-sub">
            Turn to Christ in the hour of temptation.
          </span>
        </span>
        <span className="flee-arrow">
          <Icon name="arrow" size={24} />
        </span>
      </Link>
      <div className="grid-2">
        <Link className="card time-card" to="/reading">
          <span className="tile">
            <Icon name="sun" size={20} />
          </span>
          <h2>Today's Reading</h2>
          <p>Morning · {clock(morning)}</p>
        </Link>
        <Link className="card time-card" to="/examine">
          <span className="tile">
            <Icon name="moon" size={20} />
          </span>
          <h2>Tonight's Examination</h2>
          <p>Evening · {clock(evening)}</p>
        </Link>
      </div>
      <Link className="return-row" to="/fall">
        <span className="tile">
          <Icon name="turn" size={20} />
        </span>
        <span className="row-text">
          I have fallen
          <span className="row-detail">Return to Christ in repentance.</span>
        </span>
        <Icon name="chevron" size={18} className="chevron" />
      </Link>
      <ProtectionReminder />
    </Page>
  );
}
