import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { randomItem, useBattlePacks } from "../content/selection";
import { saveEntry } from "../data/pending";
import { PrayerStep } from "../components/PrayerStep";
import { queueEvent } from "../brethren/outbox";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";
const titles = [
  "Attend to the Word",
  "Receive counsel",
  "Turn to prayer",
  "Ask your brethren to pray",
  "Now get up and go.",
];
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
      // The first prayer is for confession after a fall.
      prayer: randomItem(
        pack.prayers.length > 1 ? pack.prayers.slice(1) : pack.prayers,
      ),
      action: randomItem(pack.fleeActions),
    };
  });
  useEffect(() => {
    if (selection && !started.current) {
      started.current = true;
      void queueEvent("temptation", selection.pack.id, session).catch(() => {});
    }
  }, [selection, session]);
  useEffect(() => {
    if (step)
      (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  }, [step]);
  const close = (
    <Link className="icon-button" to="/" aria-label="Return home">
      <Icon name="close" size={20} />
    </Link>
  );
  if (!selection)
    return (
      <Page bare title="Choose a battle" bar={close}>
        <Link className="button primary block" to="/onboarding/battles">
          Choose your battles
        </Link>
      </Page>
    );
  const { pack, verse, counsel, prayer, action } = selection;
  const finish = async (answer: "stood" | "not-yet") => {
    await saveEntry({
      table: "flee_logs",
      row: {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        battle: pack.id,
        answer,
      },
    });
    if (answer === "stood")
      await queueEvent("stood_firm", pack.id).catch(() => {});
    navigate("/", { replace: true });
  };
  return (
    <Page
      bare
      eyebrow={pack.name}
      title={titles[step]}
      bar={
        <>
          {close}
          <Steps step={step} count={titles.length} />
        </>
      }
    >
      <div className="flow fade" key={step} aria-live="polite">
        {step === 0 && (
          <div className="card">
            <Scripture reference={verse} />
          </div>
        )}
        {step === 1 && (
          <div className="card">
            <ContentReading reading={counsel} prominent />
          </div>
        )}
        {step === 2 && (
          <div className="card accent">
            <h2>{prayer.title}</h2>
            <p className="verse">{prayer.text}</p>
          </div>
        )}
        {step === 3 && (
          <div className="stack">
            <PrayerStep battle={pack.id} />
          </div>
        )}
        {step === 4 && (
          <>
            <div className="card accent">
              <p className="verse">{action}</p>
            </div>
            <h2>Did you stand firm?</h2>
          </>
        )}
      </div>
      <div className="dock">
        {step < 4 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <div className="stack">
            <Action className="primary" run={() => finish("stood")}>
              Yes, by God's grace
            </Action>
            <Action run={() => finish("not-yet")}>Not yet</Action>
          </div>
        )}
      </div>
    </Page>
  );
}
