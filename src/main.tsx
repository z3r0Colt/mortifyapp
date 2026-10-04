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
if (!isNative())
  registerSW({
    onOfflineReady: () =>
      window.dispatchEvent(new Event("mortify-offline-ready")),
  });
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
