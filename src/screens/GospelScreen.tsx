import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { useContent } from "../content/useContent";
import { loadGospel } from "../content/gospel";
export default function GospelScreen() {
  const { data, error } = useContent(loadGospel);
  return (
    <Page title={data?.title ?? "Christ is our hope"}>
      {error && <p role="alert">{error}</p>}
      <p>{data?.text ?? "Loading…"}</p>
      {data && (
        <Link className="button primary" to="/onboarding/trust">
          Continue
        </Link>
      )}
    </Page>
  );
}
