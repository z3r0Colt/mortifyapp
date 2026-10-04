import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Icon } from "../components/Icon";
import { useContent } from "../content/useContent";
import { loadGospel } from "../content/gospel";
import { Paragraphs } from "../components/Paragraphs";
export default function GospelPathScreen() {
  const { data, error } = useContent(loadGospel);
  return (
    <Page
      bare
      title="You may bring your questions"
      bar={<OnboardingBar step={2} />}
    >
      {data ? (
        <div className="fade">
          <Paragraphs text={data.pathText} />
        </div>
      ) : (
        <p className="label" role="status">
          Loading…
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {data && (
        <div className="dock">
          <Link className="button" to="/onboarding/battles">
            Continue
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      )}
    </Page>
  );
}
