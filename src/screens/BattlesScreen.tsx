import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
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
    <Page title="Choose your battles">
      <p>Choose the areas where you need help with prayer and examination.</p>
      {packs.map((pack) => (
        <label className="card row" key={pack.id}>
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
          {pack.name}
        </label>
      ))}
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
        <p>Select at least one battle.</p>
      )}
    </Page>
  );
}
