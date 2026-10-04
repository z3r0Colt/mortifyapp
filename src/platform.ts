export function devicePlatform() {
  const ua = navigator.userAgent;
  return /android/i.test(ua)
    ? "android"
    : /iphone|ipad|ipod/i.test(ua) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? "ios"
      : "web";
}
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}
