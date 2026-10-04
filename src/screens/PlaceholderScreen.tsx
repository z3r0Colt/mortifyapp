import { Link } from "react-router-dom";
import { Page } from "../components/Page";
export default function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Page title={title}>
      <p>This screen will be completed in its next phase.</p>
      <Link to="/">Return home</Link>
    </Page>
  );
}
