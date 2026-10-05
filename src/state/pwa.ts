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
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
async function registration() {
  if (!("serviceWorker" in navigator)) return undefined;
  return navigator.serviceWorker.getRegistration().catch(() => undefined);
}
/** Waits for a downloading version to finish, up to a limit. */
async function settle(reg: ServiceWorkerRegistration) {
  const installing = reg.installing;
  if (!installing) return;
  await Promise.race([
    new Promise<void>((done) =>
      installing.addEventListener("statechange", () => {
        if (installing.state !== "installing") done();
      }),
    ),
    wait(10000),
  ]);
}
/**
 * Switches to the waiting version and reloads. Some phones never report that
 * the new version took over, so this reloads after a short wait regardless,
 * rather than waiting for a signal that may not come.
 */
export async function applyWaitingUpdate() {
  const reg = await registration();
  if (reg) await settle(reg);
  const waiting = reg?.waiting;
  if (waiting) {
    const tookOver = new Promise<void>((done) =>
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => done(),
        {
          once: true,
        },
      ),
    );
    waiting.postMessage({ type: "SKIP_WAITING" });
    await Promise.race([tookOver, wait(3000)]);
  }
  window.location.reload();
}
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!navigator.onLine) return "offline";
  const reg = await registration();
  if (!reg) return "unsupported";
  await Promise.race([reg.update().catch(() => {}), wait(10000)]);
  await settle(reg);
  if (!reg.waiting) return "current";
  void applyWaitingUpdate();
  return "updating";
}
/**
 * Last resort when an update will not install: drops the offline copy of the
 * app and loads it fresh. Sign-in, settings and anything waiting to upload live
 * elsewhere on the phone and are kept.
 */
export async function reinstallLatest() {
  const reg = await registration();
  await reg?.unregister();
  if ("caches" in window)
    for (const key of await caches.keys()) await caches.delete(key);
  window.location.reload();
}
export const usePwa = create<State>(() => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  installPrompt: null,
  installed: false,
  updateReady: false,
  applyUpdate: () => void applyWaitingUpdate(),
  checkForUpdate,
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
