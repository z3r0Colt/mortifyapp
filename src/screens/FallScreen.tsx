import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useBattlePacks } from "../content/selection";
import { saveEntry } from "../data/pending";
import { encryptText } from "../privacy/crypto";
import { journalKey } from "../state/privacy";
import { TellBrethrenStep } from "../components/TellBrethrenStep";
import { ContentReading } from "../components/ContentReading";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";
const titles = [
  "Return to Christ",
  "Confession",
  "Seek the care of brethren",
  "A short look back",
  "Rest in Christ",
];
export default function FallScreen() {
  const packs = useBattlePacks();
  const [battle, setBattle] = useState(packs[0]?.id ?? "");
  const pack = packs.find((p) => p.id === battle);
  const [step, setStep] = useState(0);
  const [confession, setConfession] = useState("");
  const [reflection, setReflection] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (step)
      (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  }, [step]);
  // Leaving is offered only before anything private has been written.
  const close = (
    <Link className="icon-button" to="/" aria-label="Return home">
      <Icon name="close" size={20} />
    </Link>
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
      title={titles[step]}
      bar={
        <>
          {step === 0 ? close : <span />}
          <Steps step={step} count={titles.length} />
        </>
      }
    >
      <div className="flow fade" key={step}>
        {step === 0 && (
          <>
            {packs.length > 1 && (
              <label>
                Battle
                <select
                  value={battle}
                  onChange={(e) => setBattle(e.target.value)}
                >
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {pack.afterFallReadings.map((r, i) => (
              <article className="card" key={i}>
                <ContentReading reading={r} />
              </article>
            ))}
          </>
        )}
        {step === 1 && (
          <>
            <div className="card accent">
              <h2>{pack.prayers[0].title}</h2>
              <p>{pack.prayers[0].text}</p>
            </div>
            <label>
              Private confession (optional)
              <textarea
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
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
                onChange={(e) => setReflection(e.target.value)}
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
