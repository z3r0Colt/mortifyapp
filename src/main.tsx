import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-500.css";
import "@fontsource/eb-garamond/latin-600.css";
import "@fontsource/literata/latin-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "./styles.css";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { isNative } from "./native/platform";
import { usePwa, watchInstall } from "./state/pwa";
import { isInstalled } from "./platform";
if (!isNative()) {
  watchInstall();
  const update = registerSW({
    onOfflineReady: () =>
      window.dispatchEvent(new Event("mortify-offline-ready")),
    onNeedRefresh: () => usePwa.setState({ updateReady: true }),
    // Installed apps can stay open for days; look for a new version every
    // fifteen minutes and whenever the app comes back to the front.
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => {});
      };
      setInterval(check, 15 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
  usePwa.setState({ applyUpdate: () => void update(true) });
  // Ask the browser not to clear the offline copy under storage pressure.
  if (isInstalled()) void navigator.storage?.persist?.().catch(() => false);
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
