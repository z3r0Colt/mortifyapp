import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useBattlePacks } from "../content/selection";
import { db } from "../data/db";
import { encryptText } from "../privacy/crypto";
import { journalKey } from "../state/privacy";
import { TellBrethrenStep } from "../components/TellBrethrenStep";
import { ContentReading } from "../components/ContentReading";
export default function FallScreen() {
  const packs = useBattlePacks();
  const [battle, setBattle] = useState(packs[0]?.id ?? "");
  const pack = packs.find((p) => p.id === battle);
  const [step, setStep] = useState(0);
  const [confession, setConfession] = useState("");
  const [reflection, setReflection] = useState("");
  const navigate = useNavigate();
  if (!pack)
    return (
      <Page calm title="Choose a battle">
        <Link to="/onboarding/battles">Choose your battles</Link>
      </Page>
    );
  const reading = pack.afterFallReadings[pack.afterFallReadings.length - 1];
  return (
    <Page
      calm
      title={
        [
          "Return to Christ",
          "Confession",
          "Seek the care of brethren",
          "A short look back",
          "Rest in Christ",
        ][step]
      }
    >
      <div className="flow">
        {step === 0 && (
          <>
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
            {pack.afterFallReadings.map((r, i) => (
              <article className="card" key={i}>
                <ContentReading reading={r} />
              </article>
            ))}
          </>
        )}
        {step === 1 && (
          <>
            <h2>{pack.prayers[0].title}</h2>
            <p>{pack.prayers[0].text}</p>
            <label>
              Private confession (optional)
              <textarea
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                maxLength={20000}
              />
            </label>
            <p className="label">Your confession stays on this device.</p>
          </>
        )}
        {step === 2 && <TellBrethrenStep battle={battle} />}
        {step === 3 && (
          <>
            <ol>
              {pack.examinationQuestions.slice(0, 2).map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
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
          <>
            <ContentReading reading={reading} prominent />
            <Action
              run={async () => {
                await db.falls.add({
                  time: Date.now(),
                  battle,
                  confession: await encryptText(journalKey(), confession),
                  reflection: await encryptText(journalKey(), reflection),
                });
                navigate("/", { replace: true });
              }}
            >
              Return home
            </Action>
          </>
        )}
        {step < 4 && (
          <button onClick={() => setStep(step + 1)}>Continue</button>
        )}
      </div>
    </Page>
  );
}
