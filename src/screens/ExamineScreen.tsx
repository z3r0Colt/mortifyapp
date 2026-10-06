import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Tags } from "../components/Tags";
import { Icon } from "../components/Icon";
import { ListGroup, ListLink } from "../components/List";
import { useBattlePacks } from "../content/selection";
import { saveEntry } from "../data/pending";
import { heartRoots, occasionTags } from "../data/patterns";
import { encryptText } from "../privacy/crypto";
import { journalKey } from "../state/privacy";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
import { ChapterReading } from "../components/ChapterReading";
import { useEveningReading, useQuestionSet } from "../content/useDaily";
export default function ExamineScreen() {
  const packs = useBattlePacks();
  const [battle, setBattle] = useState(packs[0]?.id ?? "");
  const pack = packs.find((p) => p.id === battle);
  const reading = useEveningReading();
  const questions = useQuestionSet(pack);
  const [roots, setRoots] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<"saved" | "waiting" | null>(null);
  if (!pack)
    return (
      <Page title="Choose a battle">
        <Link className="button primary block" to="/onboarding/battles">
          Choose your battles
        </Link>
      </Page>
    );
  return (
    <Page
      title="Tonight's Examination"
      eyebrow="Evening"
      lede="Bring this day before the Lord."
    >
      {saved ? (
        <div className="card accent fade">
          <p>
            Your examination is saved. Take these matters to the Lord in prayer.
          </p>
          {saved === "waiting" && (
            <p className="label">
              You're offline. It will upload when you reconnect.
            </p>
          )}
          <Link className="button block" to="/">
            Return home
          </Link>
        </div>
      ) : (
        <>
          {reading && (
            <>
              <div className="card">
                <h2 className="section-title">An evening psalm</h2>
                <ChapterReading reference={reading.psalm} />
              </div>
              <div className="card">
                <Scripture reference={reading.verse} />
              </div>
              <div className="card">
                <ContentReading reading={reading.counsel} />
              </div>
            </>
          )}
          {packs.length > 1 && (
            <label>
              Battle
              <select
                value={battle}
                onChange={(e) => setBattle(e.target.value)}
              >
                {packs.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <article className="card">
            <h2 className="section-title">Questions for tonight</h2>
            <ol className="numbered">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </article>
          <Tags
            title="Heart roots"
            options={heartRoots}
            value={roots}
            onChange={setRoots}
          />
          <Tags
            title="Occasions of sin"
            options={occasionTags}
            value={occasions}
            onChange={setOccasions}
          />
          <label>
            Private examination
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={20000}
            />
          </label>
          <p className="hint">
            <Icon name="lock" size={16} />
            Encrypted with your PIN. Only you can read it.
          </p>
          <div className="stack">
            <Action
              className="primary"
              run={async () => {
                const uploaded = await saveEntry({
                  table: "journals",
                  row: {
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    battle,
                    roots,
                    occasions,
                    body: await encryptText(journalKey(), text),
                  },
                });
                setSaved(uploaded ? "saved" : "waiting");
              }}
            >
              Save examination
            </Action>
          </div>
        </>
      )}
      <ListGroup title="Looking back">
        <ListLink
          to="/journal"
          icon="book"
          label="My journal"
          detail="Past examinations and confessions"
        />
        <ListLink
          to="/patterns"
          icon="chart"
          label="See the past week's patterns"
        />
      </ListGroup>
    </Page>
  );
}
