// Links shared from the Brethren screen. An invite (…/invite#token) is a
// one-time link that links the two at once when the one invited confirms; a
// code link (…/add#CODE) opens Add by code with the code filled in. The token
// or code rides after the #, so it never reaches a web server, and is kept on
// this device until used, because a new person must sign in and set up first.
const INVITE = "mortify-invite";
const CODE = "mortify-code";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const base = () => import.meta.env.BASE_URL;
export const inviteUrl = (token: string) =>
  `${location.origin}${base()}invite#${token}`;
export const codeUrl = (code: string) =>
  `${location.origin}${base()}add#${code}`;
function keep(key: string, value: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, at: Date.now() }));
  } catch {
    // Without storage the link still works when opened again later.
  }
}
function read(key: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      value?: unknown;
      at?: unknown;
    } | null;
    if (
      typeof saved?.value === "string" &&
      typeof saved.at === "number" &&
      Date.now() - saved.at < WEEK
    )
      return saved.value;
    if (saved) localStorage.removeItem(key);
  } catch {
    // Treated as nothing waiting.
  }
  return null;
}
function drop(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
export const pendingInvite = () => read(INVITE);
export const clearInvite = () => drop(INVITE);
export const pendingCode = () => read(CODE);
export const clearCode = () => drop(CODE);
/** Keeps a token or code from the address and moves on to where it is used,
 *  before the app first draws. */
export function captureLink() {
  const path = location.pathname.slice(base().length).replace(/\/$/, "");
  const value = decodeURIComponent(location.hash.slice(1)).trim();
  if (path === "invite") {
    if (/^[0-9a-f]{64}$/i.test(value)) keep(INVITE, value.toLowerCase());
    history.replaceState(null, "", `${base()}brethren`);
  } else if (path === "add") {
    const code = value.toUpperCase();
    if (/^[A-Z2-9]{6}([A-Z2-9]{2})?$/.test(code)) keep(CODE, code);
    history.replaceState(null, "", `${base()}brethren/add`);
  }
}
