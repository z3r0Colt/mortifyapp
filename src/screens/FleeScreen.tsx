import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { fleePrayers, randomItem, useBattlePacks } from "../content/selection";
import { PrayerCard } from "../components/PrayerCard";
import type { Pack } from "../content/loader";
import { saveEntry } from "../data/pending";
import { PrayerStep } from "../components/PrayerStep";
import { queueEvent } from "../brethren/outbox";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";
import { UrgentHelp } from "../components/UrgentHelp";
import { SermonList } from "../components/SermonList";
import { useContent } from "../content/useContent";
import { loadFeaturedSermons } from "../content/loader";
import { useCircleWords } from "../brethren/words";
import { useBrethren } from "../state/brethren";
const titles = [
  "Attend to the Word",
  "Receive counsel",
  "Turn to prayer",
  "Ask your brethren to pray",
  "Now get up and go.",
];
export default function FleeScreen() {
  const { circle } = useCircleWords();
  const packs = useBattlePacks();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [sought, setSought] = useState(false);
  const [session] = useState(() => crypto.randomUUID());
  // After "Not yet", the battle goes on: offer the way back in, not Home.
  const [notYet, setNotYet] = useState(false);
  // With no brethren linked yet there is no one to ask in the app, so the
  // prayer step does not hold the user back.
  const noCircle = useBrethren(
    (s) => s.loaded && !s.error && (!s.profile || !s.peers.length),
  );
  const { data: featured } = useContent(loadFeaturedSermons);
  const choose = (pack: Pack) => ({
    pack,
    verse: randomItem(pack.verses),
    counsel: randomItem(pack.counsel),
    prayer: randomItem(fleePrayers(pack)),
    action: randomItem(pack.fleeActions),
  });
  // With one battle there is nothing to ask; with several, the user says
  // which temptation this is before the steps begin.
  const [selection, setSelection] = useState(() =>
    packs.length === 1 ? choose(packs[0]) : null,
  );
  useEffect(() => {
    if (step || notYet)
      (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  }, [step, notYet]);
  const close = (
    <Link className="icon-button" to="/" aria-label="Return home">
      <Icon name="close" size={20} />
    </Link>
  );
  if (!selection && packs.length > 1)
    return (
      <Page
        bare
        eyebrow="In temptation"
        title="What are you fleeing?"
        lede="Choose one, and turn to the Word."
        bar={close}
      >
        <ul className="list fade">
          {packs.map((pack) => (
            <li key={pack.id}>
              <button
                className="list-row"
                onClick={() => setSelection(choose(pack))}
              >
                <span className="row-text">{pack.name}</span>
                <Icon name="chevron" size={18} className="chevron" />
              </button>
            </li>
          ))}
        </ul>
      </Page>
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
  const answer = async (answer: "stood" | "not-yet") => {
    await saveEntry({
      table: "flee_logs",
      row: {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        battle: pack.id,
        answer,
      },
    });
    if (answer === "stood") {
      await queueEvent("stood_firm", pack.id).catch(() => {});
      navigate("/", { replace: true });
    } else setNotYet(true);
  };
  const next = () => {
    // Shared only once the user has sought help, never on opening Flee.
    // The session id keeps a second pass from sharing it twice.
    if (step === 3)
      void queueEvent("temptation", pack.id, session).catch(() => {});
    setStep(step + 1);
  };
  if (notYet)
    return (
      <Page
        bare
        eyebrow="In temptation"
        title="Keep fleeing"
        lede="Do not stay alone with this temptation. Christ has not left you."
        bar={close}
      >
        <div className="stack fade">
          <button
            className="primary"
            onClick={() => {
              // Another of this battle's prayers, so the second time is
              // not the same words again.
              const others = fleePrayers(pack).filter((p) => p !== prayer);
              if (others.length)
                setSelection({ ...selection, prayer: randomItem(others) });
              setNotYet(false);
              setStep(2);
            }}
          >
            Turn to prayer again
          </button>
          {!noCircle && (
            <button
              onClick={() => {
                setNotYet(false);
                setStep(3);
              }}
            >
              Ask your {circle} to pray
            </button>
          )}
          <Link className="button" to="/fall" replace>
            I have fallen
          </Link>
          <Link className="button quiet" to="/" replace>
            Return home
          </Link>
        </div>
      </Page>
    );
  return (
    <Page
      bare
      eyebrow="In temptation"
      title={step === 3 ? `Ask your ${circle} to pray` : titles[step]}
      bar={
        <>
          {close}
          <Steps step={step} count={titles.length} />
        </>
      }
    >
      <div className="flow fade" key={step} aria-live="polite">
        {step === 0 && (
          <>
            <UrgentHelp pack={pack} />
            <div className="card">
              <Scripture reference={verse} />
            </div>
          </>
        )}
        {step === 1 && (
          <div className="card">
            <ContentReading reading={counsel} prominent />
          </div>
        )}
        {step === 2 && <PrayerCard prayer={prayer} prominent />}
        {step === 3 && (
          <div className="stack">
            <PrayerStep
              battle={pack.id}
              noCircle={noCircle}
              onChosen={() => setSought(true)}
            />
          </div>
        )}
        {step === 4 && (
          <>
            <div className="card accent">
              <p className="verse">{action}</p>
            </div>
            {featured && featured.flee.length > 0 && (
              <div className="later">
                <p className="label">
                  When the hour has passed, hear the Word preached:
                </p>
                <SermonList sermons={featured.flee} />
              </div>
            )}
          </>
        )}
      </div>
      <div className="dock">
        {step < 4 ? (
          <>
            {step === 3 && !sought && !noCircle && (
              <p className="label">Ask for prayer or call someone to go on.</p>
            )}
            <button
              className="primary"
              disabled={step === 3 && !sought && !noCircle}
              onClick={next}
            >
              Continue
            </button>
          </>
        ) : (
          <div className="stack">
            {/* The question sits with its answers, so it is never scrolled
                out of sight behind them. */}
            <h2 className="dock-question">Did you stand firm?</h2>
            <Action className="primary" run={() => answer("stood")}>
              Yes, by God's grace
            </Action>
            <Action run={() => answer("not-yet")}>Not yet</Action>
          </div>
        )}
      </div>
    </Page>
  );
}
