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
import { applyDisplay, readDisplay } from "./state/display";
applyDisplay(readDisplay());
import { registerSW } from "virtual:pwa-register";
import { isNative } from "./native/platform";
import { busy, usePwa, watchInstall } from "./state/pwa";
import { isInstalled } from "./platform";
if (!isNative()) {
  watchInstall();
  // When the app was last opened or brought back to the front. A version
  // found just after that switches over at once, even on the PIN screen,
  // because nothing has been typed yet.
  let opened = Date.now();
  const update = registerSW({
    onOfflineReady: () =>
      window.dispatchEvent(new Event("mortify-offline-ready")),
    onNeedRefresh: () => {
      if (Date.now() - opened < 20000 && !busy()) void update(true);
      else usePwa.setState({ updateReady: true });
    },
    // Installed apps can stay open for days; look for a new version every
    // fifteen minutes and whenever the app comes back to the front.
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => {});
      };
      setInterval(check, 15 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          opened = Date.now();
          check();
        }
      });
      usePwa.setState({
        checkForUpdate: async () => {
          if (!navigator.onLine) return "offline";
          await registration.update();
          // A download may still be finishing; give it a few seconds.
          const installing = registration.installing;
          if (installing)
            await new Promise<void>((done) => {
              const timer = setTimeout(done, 8000);
              installing.addEventListener("statechange", () => {
                if (installing.state !== "installing") {
                  clearTimeout(timer);
                  done();
                }
              });
            });
          if (!registration.waiting) return "current";
          void update(true);
          return "updating";
        },
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
