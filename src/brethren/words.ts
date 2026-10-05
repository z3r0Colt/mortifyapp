import { useBrethren } from "../state/brethren";
import { usePreferences } from "../state/preferences";
/** True for a sister: from her brethren profile, else from onboarding. */
export function useIsSister() {
  const profileSex = useBrethren((s) => s.profile?.sex);
  const sex = usePreferences((s) => s.value.sex);
  return (profileSex ?? sex) === "sister";
}
// Brothers watch over brothers and sisters over sisters, so the circle is
// named for the one using the app.
export function useCircleWords() {
  return useIsSister()
    ? { circle: "sisters", Circle: "Sisters", one: "sister" }
    : { circle: "brethren", Circle: "Brethren", one: "brother" };
}
