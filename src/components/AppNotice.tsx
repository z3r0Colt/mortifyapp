import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePwa } from "../state/pwa";
// Mid-flow screens where a reload would interrupt someone in temptation or confession.
const flows = ["/flee", "/fall"];
/** True when switching versions now could lose something or interrupt. */
function busy(path: string) {
  if (flows.includes(path)) return true;
  return [...document.querySelectorAll("textarea, input")].some(
    (field) =>
      !["checkbox", "time", "hidden"].includes(
        (field as HTMLInputElement).type,
      ) && (field as HTMLInputElement).value.trim() !== "",
  );
}
// Applies a new version as soon as it is safe. Otherwise waits until the app
// is put away, and shows a quiet note in case it is still open. Also notes
// when the phone is offline.
export function AppNotice() {
  const { online, updateReady, applyUpdate } = usePwa();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!updateReady) return;
    if (!busy(pathname)) {
      applyUpdate();
      return;
    }
    const putAway = () => {
      if (document.visibilityState === "hidden" && !busy(pathname))
        applyUpdate();
    };
    document.addEventListener("visibilitychange", putAway);
    return () => document.removeEventListener("visibilitychange", putAway);
  }, [updateReady, pathname, applyUpdate]);
  if (updateReady)
    return (
      <div className="app-notice fade" role="status">
        <span>A new version of Mortify is ready.</span>
        <button onClick={applyUpdate}>Reload</button>
      </div>
    );
  if (!online)
    return (
      <div className="app-notice fade" role="status">
        <span>Offline. Readings and Flee still work.</span>
      </div>
    );
  return null;
}
