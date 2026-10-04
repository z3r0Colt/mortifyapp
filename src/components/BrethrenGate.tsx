import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Page } from "./Page";
import { Action } from "./Action";
import { useAuth } from "../state/auth";
import { useBrethren } from "../state/brethren";
export function BrethrenGate({
  children,
  setup = false,
}: {
  children: ReactNode;
  setup?: boolean;
}) {
  const { user, ready } = useAuth();
  const { profile, loaded, error, load, clear } = useBrethren();
  useEffect(() => {
    clear();
    if (user) void load();
  }, [user?.id, load, clear]);
  if (!ready)
    return (
      <Page title="Brethren">
        <p className="label" role="status">
          Opening brethren…
        </p>
      </Page>
    );
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!loaded)
    return (
      <Page title="Brethren">
        <p className="label" role="status">
          Reading your circle…
        </p>
      </Page>
    );
  if (error)
    return (
      <Page title="Brethren">
        <p role="alert">{error}</p>
        <p>Your private readings and entries are still available offline.</p>
        <Action run={load}>Try again</Action>
      </Page>
    );
  if (!profile && !setup) return <Navigate to="/brethren/setup" replace />;
  return children;
}
