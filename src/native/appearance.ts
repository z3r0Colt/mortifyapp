import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNative } from "./platform";
export async function nativeAppearance() {
  if (!isNative()) return;
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  await Promise.allSettled([
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }),
    StatusBar.setBackgroundColor({ color: dark ? "#16130F" : "#F5F0E6" }),
    SplashScreen.hide(),
  ]);
}
