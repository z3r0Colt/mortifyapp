import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { isNative } from "./platform";
export async function fleeTap() {
  if (isNative())
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
