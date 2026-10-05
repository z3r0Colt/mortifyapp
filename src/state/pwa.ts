import { create } from "zustand";
// Connection and update state for the installed web app.
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export type UpdateCheck = "current" | "updating" | "offline" | "unsupported";
type State = {
  online: boolean;
  /** Android's install prompt, kept from startup until used. */
  installPrompt: InstallPrompt | null;
  installed: boolean;
  /** A newer version has downloaded and is waiting. */
  updateReady: boolean;
  /** Switches to the waiting version and reloads. */
  applyUpdate: () => void;
  /** Asks the server for a newer version now, and switches to it if found. */
  checkForUpdate: () => Promise<UpdateCheck>;
};
export const usePwa = create<State>(() => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  installPrompt: null,
  installed: false,
  updateReady: false,
  applyUpdate: () => window.location.reload(),
  checkForUpdate: async () => "unsupported",
}));
// Mid-flow screens where a reload would interrupt someone in temptation or confession.
const flows = ["/flee", "/fall"];
function routePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return location.pathname.slice(base.length) || "/";
}
/** True when switching versions now could lose something or interrupt. */
export function busy(path = routePath()) {
  if (flows.includes(path)) return true;
  return [...document.querySelectorAll("textarea, input")].some(
    (field) =>
      !["checkbox", "time", "hidden"].includes(
        (field as HTMLInputElement).type,
      ) && (field as HTMLInputElement).value.trim() !== "",
  );
}
export function watchConnection() {
  const update = () => usePwa.setState({ online: navigator.onLine });
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  };
}
export function watchInstall() {
  const before = (event: Event) => {
    event.preventDefault();
    usePwa.setState({ installPrompt: event as InstallPrompt });
  };
  const done = () => usePwa.setState({ installed: true, installPrompt: null });
  window.addEventListener("beforeinstallprompt", before);
  window.addEventListener("appinstalled", done);
}
