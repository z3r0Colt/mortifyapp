import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Action } from "../components/Action";
import { usePreferences } from "../state/preferences";
// Asked once, early in onboarding (and once of older accounts), so Mortify
// speaks to each believer rightly and keeps circles of brothers and of sisters.
export default function BrotherOrSisterScreen() {
  const { save, value } = usePreferences();
  const navigate = useNavigate();
  return (
    <Page
      bare
      title="Are you a brother or a sister?"
      lede="Brothers watch over brothers in prayer, and sisters over sisters. Every saint is called to put sin to death, and this lets Mortify speak to you rightly."
      bar={value.onboarded ? undefined : <OnboardingBar step={2} />}
    >
      <div className="stack">
        {(
          [
            ["brother", "A brother"],
            ["sister", "A sister"],
          ] as const
        ).map(([sex, label]) => (
          <Action
            key={sex}
            run={async () => {
              await save({ sex });
              navigate(value.onboarded ? "/" : "/onboarding/trust", {
                replace: true,
              });
            }}
          >
            {label}
          </Action>
        ))}
      </div>
    </Page>
  );
}
