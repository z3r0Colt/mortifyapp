import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { usePreferences } from "../state/preferences";
export default function TimesScreen() {
  const { value, save } = usePreferences();
  const [morning, setMorning] = useState(value.morning);
  const [evening, setEvening] = useState(value.evening);
  const navigate = useNavigate();
  return (
    <Page title="Make room for the Word">
      <label>
        Morning reading
        <input
          type="time"
          value={morning}
          onChange={(e) => setMorning(e.target.value)}
        />
      </label>
      <label>
        Evening examination
        <input
          type="time"
          value={evening}
          onChange={(e) => setEvening(e.target.value)}
        />
      </label>
      <p className="label">Time zone: {value.timezone}</p>
      <Action
        className="primary"
        run={async () => {
          if (!morning || !evening) throw new Error("Choose both times.");
          if (!value.trust) {
            navigate("/onboarding/trust");
            return;
          }
          if (!value.battles.length) {
            navigate("/onboarding/battles");
            return;
          }
          await save({ morning, evening, onboarded: true });
          navigate("/", { replace: true });
        }}
      >
        Begin
      </Action>
    </Page>
  );
}
