import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { usePreferences } from "../state/preferences";
export default function TimesScreen() {
  const { value, save } = usePreferences();
  const [morning, setMorning] = useState(value.morning);
  const [evening, setEvening] = useState(value.evening);
  const navigate = useNavigate();
  return (
    <Page
      bare
      title="Make room for the Word"
      lede="Choose a time each morning for Scripture and each evening to examine the day."
      bar={value.onboarded ? undefined : <OnboardingBar step={3} />}
      back={
        value.onboarded ? { to: "/settings", label: "Settings" } : undefined
      }
    >
      <div className="card">
        <label>
          <span className="row">
            <span className="tile">
              <Icon name="sun" size={20} />
            </span>
            Morning reading
          </span>
          <input
            type="time"
            value={morning}
            onChange={(e) => setMorning(e.target.value)}
          />
        </label>
        <label>
          <span className="row">
            <span className="tile">
              <Icon name="moon" size={20} />
            </span>
            Evening examination
          </span>
          <input
            type="time"
            value={evening}
            onChange={(e) => setEvening(e.target.value)}
          />
        </label>
        <p className="hint">
          <Icon name="clock" size={16} />
          Time zone: {value.timezone}
        </p>
      </div>
      <div className="dock">
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
          {value.onboarded ? "Save times" : "Begin"}
        </Action>
      </div>
    </Page>
  );
}
