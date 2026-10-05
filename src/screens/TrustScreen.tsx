import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Action } from "../components/Action";
import { usePreferences } from "../state/preferences";
export default function TrustScreen() {
  const save = usePreferences((s) => s.save);
  const navigate = useNavigate();
  return (
    <Page
      bare
      title="Are you trusting in Christ alone?"
      lede="Speak with your pastor if you have questions or doubts."
      bar={<OnboardingBar step={3} />}
    >
      <div className="stack">
        {(
          [
            ["yes", "Yes"],
            ["no", "No"],
            ["unsure", "I'm not sure"],
          ] as const
        ).map(([trust, label]) => (
          <Action
            key={trust}
            run={async () => {
              await save({ trust });
              navigate(
                trust === "yes"
                  ? "/onboarding/battles"
                  : "/onboarding/gospel-path",
              );
            }}
          >
            {label}
          </Action>
        ))}
      </div>
    </Page>
  );
}
