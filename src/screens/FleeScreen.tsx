import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { randomItem, useBattlePacks } from "../content/selection";
import { db } from "../data/db";
import { PrayerStep } from "../components/PrayerStep";
import { queueEvent } from "../brethren/outbox";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
export default function FleeScreen() {
  const packs = useBattlePacks();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [session] = useState(() => crypto.randomUUID());
  const started = useRef(false);
  const [selection] = useState(() => {
    if (!packs.length) return null;
    const pack = randomItem(packs);
    return {
      pack,
      verse: randomItem(pack.verses),
      counsel: randomItem(pack.counsel),
      prayer: randomItem(pack.prayers),
      action: randomItem(pack.fleeActions),
    };
  });
  useEffect(() => {
    if (selection && !started.current) {
      started.current = true;
      void queueEvent("temptation", selection.pack.id, session).catch(() => {});
    }
  }, [selection, session]);
  if (!selection)
    return (
      <Page title="Choose a battle">
        <Link to="/onboarding/battles">Choose your battles</Link>
      </Page>
    );
  const { pack, verse, counsel, prayer, action } = selection;
  const finish = async (answer: "stood" | "not-yet") => {
    await db.fleeLogs.add({ time: Date.now(), battle: pack.id, answer });
    if (answer === "stood")
      await queueEvent("stood_firm", pack.id).catch(() => {});
    navigate("/", { replace: true });
  };
  return (
    <Page
      title={
        [
          "Attend to the Word",
          "Receive counsel",
          "Turn to prayer",
          "Ask your brethren to pray",
          "Now get up and go.",
        ][step]
      }
    >
      <div className="flow" aria-live="polite">
        {step === 0 && (
          <>
            <Scripture reference={verse} />
          </>
        )}
        {step === 1 && (
          <>
            <ContentReading reading={counsel} prominent />
          </>
        )}
        {step === 2 && (
          <>
            <h2>{prayer.title}</h2>
            <p className="verse">{prayer.text}</p>
          </>
        )}
        {step === 3 && <PrayerStep battle={pack.id} />}
        {step < 4 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <>
            <p>{action}</p>
            <h2>Did you stand firm?</h2>
            <div className="stack">
              <Action className="primary" run={() => finish("stood")}>
                Yes, by God's grace
              </Action>
              <Action run={() => finish("not-yet")}>Not yet</Action>
            </div>
          </>
        )}
      </div>
      <Link className="quiet" to="/">
        Return home
      </Link>
    </Page>
  );
}
