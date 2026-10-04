import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Action } from "../components/Action";
import { useApp } from "../state/app";
import { usePreferences } from "../state/preferences";
export default function BattlesScreen() {
  const packs = useApp((s) => s.packs);
  const value = usePreferences((s) => s.value);
  const save = usePreferences((s) => s.save);
  const [battles, setBattles] = useState(value.battles);
  const navigate = useNavigate();
  return (
    <Page
      bare
      title="Choose your battles"
      lede="Choose the areas where you need help with prayer and examination."
      bar={value.onboarded ? undefined : <OnboardingBar step={3} />}
      back={
        value.onboarded ? { to: "/settings", label: "Settings" } : undefined
      }
    >
      <div className="choices">
        {packs.map((pack) => (
          <label className="choice" key={pack.id}>
            {pack.name}
            <input
              type="checkbox"
              checked={battles.includes(pack.id)}
              onChange={(e) =>
                setBattles(
                  e.target.checked
                    ? [...battles, pack.id]
                    : battles.filter((id) => id !== pack.id),
                )
              }
            />
          </label>
        ))}
      </div>
      <div className="dock">
        {battles.length > 0 ? (
          <Action
            className="primary"
            run={async () => {
              await save({ battles });
              navigate("/onboarding/times");
            }}
          >
            Continue
          </Action>
        ) : (
          <p className="notice">Select at least one battle.</p>
        )}
      </div>
    </Page>
  );
}
