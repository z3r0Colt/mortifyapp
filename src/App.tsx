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
import RecoveryCheckScreen from "./screens/RecoveryCheckScreen";
import BrotherOrSisterScreen from "./screens/BrotherOrSisterScreen";
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
import WelcomeScreen from "./screens/WelcomeScreen";
import JournalScreen from "./screens/JournalScreen";
import AboutScreen from "./screens/AboutScreen";
import BibleScreen from "./screens/BibleScreen";
import { clearDrafts } from "./state/drafts";
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
    clearDrafts();
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
  // A brethren profile already says brother or sister; keep the account's
  // answer the same so the question is never asked of someone with a circle.
  const profileSex = useBrethren((s) => s.profile?.sex);
  const savedSex = usePreferences((s) => s.value.sex);
  useEffect(() => {
    if (profileSex && profileSex !== savedSex && navigator.onLine)
      void usePreferences
        .getState()
        .save({ sex: profileSex })
        .catch(() => {});
  }, [profileSex, savedSex]);
  useEffect(() => {
    useMessages.setState({ rows: [], error: "" });
    if (user) return watchMessages(user.id);
  }, [user?.id]);
  // Lock when the app has been away longer than the chosen delay, so a quick
  // call to a brother from Flee does not send you back to the PIN screen.
  useEffect(() => {
    let hiddenAt = 0;
    const change = () => {
      const { security, lock } = usePrivacy.getState();
      const after = (security?.lockAfter ?? 1) * 60000;
      if (document.visibilityState === "hidden") {
        if (after === 0) lock();
        else hiddenAt = Date.now();
      } else {
        if (hiddenAt && Date.now() - hiddenAt >= after) lock();
        hiddenAt = 0;
      }
    };
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
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
    ![
      "/onboarding/welcome",
      "/onboarding/gospel",
      "/onboarding/sign-in",
      "/debug",
    ].includes(location.pathname)
  )
    return <Navigate to="/onboarding/welcome" replace />;
  // Flee holds nothing private, so it opens without the PIN: the hour of
  // temptation is no time to type one. It stays in the same place in the
  // tree, so locking part-way through does not send the user back to the
  // start. Everything else waits for the PIN.
  if (user && value.onboarded && !privacy.key && location.pathname !== "/flee")
    return <PinScreen />;
  if (privacy.recoveryCode) return <RecoveryCodeScreen />;
  // Accounts made before the question was asked answer it once. Never in the
  // hour of temptation, and never offline, where the answer cannot be saved.
  if (
    user &&
    value.onboarded &&
    !value.sex &&
    !profileSex &&
    brethrenLoaded &&
    navigator.onLine &&
    !["/flee", "/fall", "/onboarding/brother-or-sister"].includes(
      location.pathname,
    )
  )
    return <Navigate to="/onboarding/brother-or-sister" replace />;
  if (
    !value.onboarded &&
    !location.pathname.startsWith("/onboarding") &&
    location.pathname !== "/debug"
  )
    return <Navigate to="/onboarding/welcome" replace />;
  return (
    <>
      <div hidden={!!background}>
        <Routes location={background ?? location}>
          <Route path="/bible/:book/:chapter" element={<ChapterScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/recovery-check" element={<RecoveryCheckScreen />} />
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
          <Route path="/onboarding/welcome" element={<WelcomeScreen />} />
          <Route path="/onboarding/gospel" element={<GospelScreen />} />
          <Route
            path="/onboarding/brother-or-sister"
            element={<BrotherOrSisterScreen />}
          />
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
          <Route path="/journal" element={<JournalScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/bible" element={<BibleScreen />} />
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
