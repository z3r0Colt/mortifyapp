// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { useNotify } from "./notify";
import { useAuth } from "./auth";

const registered = vi.hoisted(() => ({ value: false }));
vi.mock("../brethren/push", () => ({
  devicePushEnabled: async () => registered.value,
}));
const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const android = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129";
function browser(agent: string, permission?: NotificationPermission) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(agent);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  if (permission) {
    vi.stubGlobal("Notification", { permission });
    vi.stubGlobal("PushManager", function PushManager() {});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
  }
}
const state = async () => {
  await useNotify.getState().refresh();
  return useNotify.getState().state;
};
beforeEach(() => {
  registered.value = false;
  useAuth.setState({ user: { id: "user-1" } as User, ready: true });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("an iPhone in Safari is told to add Mortify to the home screen", async () => {
  browser(iphone);
  expect(await state()).toBe("install");
});
test("a refused permission is reported as blocked", async () => {
  browser(android, "denied");
  expect(await state()).toBe("blocked");
});
test("allowed but not registered is off; registered is ready", async () => {
  browser(android, "granted");
  expect(await state()).toBe("off");
  registered.value = true;
  expect(await state()).toBe("ready");
});
