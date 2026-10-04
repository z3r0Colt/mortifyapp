import { usePwa } from "../state/pwa";
// A quiet line at the top for being offline or for a new version.
// Updates wait for a tap so nothing being written is lost to a reload.
export function AppNotice() {
  const { online, updateReady, applyUpdate } = usePwa();
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
