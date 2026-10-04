import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { useContent } from "../content/useContent";
import { loadGospel } from "../content/gospel";
export default function GospelPathScreen() {
  const { data, error } = useContent(loadGospel);
  return (
    <Page title="You may bring your questions">
      <p>{data?.pathText ?? "Loading…"}</p>
      {error && <p role="alert">{error}</p>}
      {data && (
        <Link className="button" to="/onboarding/battles">
          Continue
        </Link>
      )}
    </Page>
  );
}
