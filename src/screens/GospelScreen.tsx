import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Icon } from "../components/Icon";
import { useContent } from "../content/useContent";
import { loadGospel } from "../content/gospel";
import { Paragraphs } from "../components/Paragraphs";
import { useAuth } from "../state/auth";
export default function GospelScreen() {
  const { data, error } = useContent(loadGospel);
  const user = useAuth((s) => s.user);
  return (
    <Page
      bare
      eyebrow="First, the good news"
      title={data?.title ?? "Christ is our hope"}
      bar={<OnboardingBar step={0} />}
    >
      {error && <p role="alert">{error}</p>}
      {data ? (
        <div className="fade">
          <Paragraphs text={data.text} />
        </div>
      ) : (
        <p className="label" role="status">
          Loading…
        </p>
      )}
      {data && (
        <div className="dock">
          <Link
            className="button primary"
            to={user ? "/onboarding/trust" : "/onboarding/sign-in"}
          >
            Continue
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      )}
    </Page>
  );
}
