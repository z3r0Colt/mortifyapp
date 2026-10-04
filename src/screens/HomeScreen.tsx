import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { ProtectionReminder } from "../components/ProtectionReminder";
import { fleeTap } from "../native/haptics";
export default function HomeScreen() {
  return (
    <Page title="Watch and pray">
      <p>Turn to Christ in the hour of temptation.</p>
      <Link
        className="button flee"
        to="/flee"
        onClick={() => {
          void fleeTap();
        }}
      >
        Flee
      </Link>
      <Link className="card quiet" to="/reading">
        <h2>Today's Reading</h2>
        <p>Make room for the Word.</p>
      </Link>
      <Link className="card quiet" to="/examine">
        <h2>Tonight's Examination</h2>
        <p>Bring this day before the Lord.</p>
      </Link>
      <Link className="quiet" to="/fall">
        I have fallen
      </Link>
      <ProtectionReminder />
    </Page>
  );
}
