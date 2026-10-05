import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { useApp } from "./state/app";
import DebugScreen from "./screens/DebugScreen";
import { usePreferences } from "./state/preferences";
import { Page } from "./components/Page";
import { TabBar } from "./components/TabBar";
import GospelScreen from "./screens/GospelScreen";
import TrustScreen from "./screens/TrustScreen";
import GospelPathScreen from "./screens/GospelPathScreen";
import BattlesScreen from "./screens/BattlesScreen";
import TimesScreen from "./screens/TimesScreen";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import FleeScreen from "./screens/FleeScreen";
import ExamineScreen from "./screens/ExamineScreen";
import PatternsScreen from "./screens/PatternsScreen";
import FallScreen from "./screens/FallScreen";
import ReadingScreen from "./screens/ReadingScreen";
import PinScreen from "./screens/PinScreen";
import PrivacyScreen from "./screens/PrivacyScreen";
import { usePrivacy } from "./state/privacy";
import ProtectionScreen from "./screens/ProtectionScreen";
import { watchAuth } from "./state/auth";
import SignInScreen from "./screens/SignInScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import { BrethrenGate } from "./components/BrethrenGate";
import BrethrenScreen from "./screens/BrethrenScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";
import AddBrethrenScreen from "./screens/AddBrethrenScreen";
import SharingScreen from "./screens/SharingScreen";
import MessagesScreen from "./screens/MessagesScreen";
import { useAuth } from "./state/auth";
import { useMessages, watchMessages } from "./state/messages";
import SharedProfileScreen from "./screens/SharedProfileScreen";
import { watchOutbox, publishBattles } from "./brethren/outbox";
import { watchPending } from "./data/pending";
import { AppNotice } from "./components/AppNotice";
import { watchConnection } from "./state/pwa";
import { useBrethren } from "./state/brethren";
import { nativeLifecycle } from "./native/lifecycle";
import { scheduleReminders } from "./native/reminders";
import { db } from "./data/db";
import DiscreetScreen from "./screens/DiscreetScreen";
import { checkShield } from "./native/protection";
import ChapterScreen from "./screens/ChapterScreen";
import RecoveryCodeScreen from "./screens/RecoveryCodeScreen";
import RemindersScreen from "./screens/RemindersScreen";
function Router() {
  const { value, loaded, error } = usePreferences();
  const app = useApp();
  const location = useLocation();
  const chapterOpen = location.pathname.startsWith("/bible/");
  const background = chapterOpen
    ? (location.state as { backgroundLocation?: Location } | null)
        ?.backgroundLocation
    : undefined;
  const navigate = useNavigate();
  useEffect(() => {
    let done = false;
    let cleanup: (() => void) | undefined;
    void nativeLifecycle(navigate)
      .then((remove) => {
        if (done) remove();
        else cleanup = remove;
      })
      .catch(() => {});
    return () => {
      done = true;
      cleanup?.();
    };
  }, [navigate]);
  useEffect(() => {
    void db.cloudKv.get("native-reminders").then((enabled) => {
      if (enabled?.value === "on")
        void scheduleReminders(value).catch(() => {});
    });
  }, [value.morning, value.evening]);
  const privacy = usePrivacy();
  const user = useAuth((s) => s.user);
  const authReady = useAuth((s) => s.ready);
  const brethrenLoaded = useBrethren((s) => s.loaded);
  const battles = usePreferences((s) => s.value.battles);
  useEffect(() => {
    if (loaded) void checkShield();
  }, [loaded, authReady, user?.id, brethrenLoaded]);
  useEffect(() => {
    useBrethren.getState().clear();
    if (user) {
      void useBrethren.getState().load();
      const stopOutbox = watchOutbox();
      const stopPending = watchPending();
      return () => {
        stopOutbox();
        stopPending();
      };
    }
  }, [user?.id]);
  useEffect(() => {
    if (brethrenLoaded) void publishBattles().catch(() => {});
  }, [brethrenLoaded, battles]);
  useEffect(() => {
    useMessages.setState({ rows: [], error: "" });
    if (user) return watchMessages(user.id);
  }, [user?.id]);
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "hidden") privacy.lock();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [privacy.lock]);
  if (error || app.error)
    return (
      <Page title="Unable to open Mortify">
        <p role="alert">{error || app.error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </Page>
    );
  if (privacy.error)
    return (
      <Page title="Private storage">
        <p role="alert">{privacy.error}</p>
      </Page>
    );
  if (!authReady || !loaded || !app.ready || !privacy.loaded)
    return (
      <Page title="Mortify">
        <p className="label" role="status">
          Opening your study…
        </p>
      </Page>
    );
  if (
    !user &&
    !["/onboarding/gospel", "/onboarding/sign-in", "/debug"].includes(
      location.pathname,
    )
  )
    return <Navigate to="/onboarding/gospel" replace />;
  if (user && value.onboarded && !privacy.key) return <PinScreen />;
  if (privacy.recoveryCode) return <RecoveryCodeScreen />;
  if (
    !value.onboarded &&
    !location.pathname.startsWith("/onboarding") &&
    location.pathname !== "/debug"
  )
    return <Navigate to="/onboarding/gospel" replace />;
  return (
    <>
      <div hidden={!!background}>
        <Routes location={background ?? location}>
          <Route path="/bible/:book/:chapter" element={<ChapterScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/discreet" element={<DiscreetScreen />} />
          <Route path="/protection" element={<ProtectionScreen />} />
          <Route path="/sign-in" element={<Navigate to="/" replace />} />
          <Route path="/onboarding/sign-in" element={<SignInScreen />} />
          <Route path="/onboarding/reminders" element={<RemindersScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route
            path="/brethren"
            element={
              <BrethrenGate>
                <BrethrenScreen />
              </BrethrenGate>
            }
          />
          <Route
            path="/brethren/setup"
            element={
              <BrethrenGate setup>
                <ProfileSetupScreen />
              </BrethrenGate>
            }
          />
          <Route
            path="/brethren/add"
            element={
              <BrethrenGate>
                <AddBrethrenScreen />
              </BrethrenGate>
            }
          />
          <Route
            path="/brethren/sharing"
            element={
              <BrethrenGate>
                <SharingScreen />
              </BrethrenGate>
            }
          />
          <Route
            path="/brethren/messages"
            element={
              <BrethrenGate>
                <MessagesScreen />
              </BrethrenGate>
            }
          />
          <Route path="/debug" element={<DebugScreen />} />
          <Route
            path="/brethren/contact"
            element={<Navigate to="/brethren/sharing" replace />}
          />
          <Route
            path="/brethren/profile/:id"
            element={
              <BrethrenGate>
                <SharedProfileScreen />
              </BrethrenGate>
            }
          />
          <Route
            path="/brethren/preview"
            element={
              <BrethrenGate>
                <SharedProfileScreen preview />
              </BrethrenGate>
            }
          />
          <Route path="/onboarding/gospel" element={<GospelScreen />} />
          <Route path="/onboarding/trust" element={<TrustScreen />} />
          <Route
            path="/onboarding/gospel-path"
            element={<GospelPathScreen />}
          />
          <Route path="/onboarding/battles" element={<BattlesScreen />} />
          <Route path="/onboarding/times" element={<TimesScreen />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/flee" element={<FleeScreen />} />
          <Route path="/reading" element={<ReadingScreen />} />
          <Route path="/examine" element={<ExamineScreen />} />
          <Route path="/patterns" element={<PatternsScreen />} />
          <Route path="/fall" element={<FallScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {background && (
        <Routes>
          <Route path="/bible/:book/:chapter" element={<ChapterScreen />} />
        </Routes>
      )}
      <AppNotice />
      {value.onboarded &&
        !chapterOpen &&
        !["/flee", "/fall"].includes(location.pathname) &&
        !location.pathname.startsWith("/onboarding") && <TabBar />}
    </>
  );
}
export default function App() {
  const load = useApp((s) => s.load);
  const loadPreferences = usePreferences((s) => s.load);
  const loadPrivacy = usePrivacy((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  const user = useAuth((s) => s.user);
  const authReady = useAuth((s) => s.ready);
  useEffect(watchAuth, []);
  useEffect(watchConnection, []);
  // Everything private belongs to an account, so load it once we know whose.
  useEffect(() => {
    if (!authReady) return;
    usePreferences.setState({ loaded: false, error: null });
    usePrivacy.setState({
      loaded: false,
      key: null,
      error: "",
      recoveryCode: null,
      recoveryReason: null,
    });
    void loadPreferences();
    void loadPrivacy();
  }, [authReady, user?.id, loadPreferences, loadPrivacy]);
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
    >
      <Router />
    </BrowserRouter>
  );
}
