import { create } from "zustand";
// Connection and update state for the installed web app.
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type State = {
  online: boolean;
  /** Android's install prompt, kept from startup until used. */
  installPrompt: InstallPrompt | null;
  installed: boolean;
  /** A newer version has downloaded and is waiting. */
  updateReady: boolean;
  /** Switches to the waiting version and reloads. */
  applyUpdate: () => void;
};
export const usePwa = create<State>(() => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  installPrompt: null,
  installed: false,
  updateReady: false,
  applyUpdate: () => window.location.reload(),
}));
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
