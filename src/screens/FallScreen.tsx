import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { fallPrayers, useBattlePacks } from "../content/selection";
import { PrayerCard } from "../components/PrayerCard";
import { saveEntry } from "../data/pending";
import { encryptText } from "../privacy/crypto";
import { journalKey } from "../state/privacy";
import { TellBrethrenStep } from "../components/TellBrethrenStep";
import { ContentReading } from "../components/ContentReading";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";
import { UrgentHelp } from "../components/UrgentHelp";
import { useCircleWords } from "../brethren/words";
import { useDraft } from "../state/drafts";
const titles = [
  "Return to Christ",
  "Confession",
  "Seek the care of brethren",
  "A short look back",
  "Rest in Christ",
];
export default function FallScreen() {
  const { circle } = useCircleWords();
  const packs = useBattlePacks();
  // Held as a draft so a lock part-way through returns to the same step
  // with the words still there.
  const [draft, setDraft, clearDraft] = useDraft("fall", {
    battle: packs[0]?.id ?? "",
    step: 0,
    confession: "",
    reflection: "",
  });
  const { battle, step, confession, reflection } = draft;
  const setStep = (step: number) => setDraft({ step });
  const pack = packs.find((p) => p.id === battle);
  const navigate = useNavigate();
  useEffect(() => {
    if (step)
      (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  }, [step]);
  // Leaving is offered only before anything private has been written;
  // after that the way is back a step, never lost.
  const close = (
    <Link
      className="icon-button"
      to="/"
      aria-label="Return home"
      onClick={clearDraft}
    >
      <Icon name="close" size={20} />
    </Link>
  );
  const back = (
    <button
      className="icon-button"
      aria-label="Back a step"
      onClick={() => setStep(step - 1)}
    >
      <Icon name="back" size={20} />
    </button>
  );
  if (!pack)
    return (
      <Page calm bare title="Choose a battle" bar={close}>
        <Link className="button primary block" to="/onboarding/battles">
          Choose your battles
        </Link>
      </Page>
    );
  const reading = pack.afterFallReadings[pack.afterFallReadings.length - 1];
  return (
    <Page
      calm
      bare
      title={
        step === 2 && circle === "sisters"
          ? "Seek the care of your sisters"
          : titles[step]
      }
      bar={
        <>
          {step === 0 ? close : back}
          <Steps step={step} count={titles.length} />
        </>
      }
    >
      <div className="flow fade" key={step}>
        {step === 0 && (
          <>
            {packs.length > 1 && (
              <label style={{ marginTop: 0 }}>
                Battle
                <select
                  value={battle}
                  onChange={(e) => setDraft({ battle: e.target.value })}
                >
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <UrgentHelp pack={pack} />
            {pack.afterFallReadings.map((r, i) => (
              <article className="card" key={i}>
                <ContentReading reading={r} />
              </article>
            ))}
          </>
        )}
        {step === 1 && (
          <>
            {fallPrayers(pack).map((prayer) => (
              <PrayerCard key={prayer.title} prayer={prayer} />
            ))}
            <label>
              Private confession (optional)
              <textarea
                value={confession}
                onChange={(e) => setDraft({ confession: e.target.value })}
                maxLength={20000}
              />
            </label>
            <p className="hint">
              <Icon name="lock" size={16} />
              Encrypted with your PIN. Only you can read it.
            </p>
          </>
        )}
        {step === 2 && <TellBrethrenStep battle={battle} />}
        {step === 3 && (
          <>
            <div className="card">
              <ol className="numbered">
                {pack.examinationQuestions.slice(0, 2).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
            <label>
              Private reflection (optional)
              <textarea
                value={reflection}
                onChange={(e) => setDraft({ reflection: e.target.value })}
                maxLength={20000}
              />
            </label>
          </>
        )}
        {step === 4 && (
          <div className="card accent">
            <ContentReading reading={reading} prominent />
          </div>
        )}
      </div>
      <div className="dock">
        {step < 4 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <Action
            className="primary"
            run={async () => {
              await saveEntry({
                table: "falls",
                row: {
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                  battle,
                  confession: await encryptText(journalKey(), confession),
                  reflection: await encryptText(journalKey(), reflection),
                },
              });
              clearDraft();
              navigate("/", { replace: true });
            }}
          >
            Return home
          </Action>
        )}
      </div>
    </Page>
  );
}
