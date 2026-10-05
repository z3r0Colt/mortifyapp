import type { ReactNode } from "react";
import { Page } from "../components/Page";
import { useDailyReading } from "../content/useDaily";
import { useBattlePacks } from "../content/selection";
import { useContent } from "../content/useContent";
import { loadFeaturedSermons } from "../content/loader";
import { SermonList } from "../components/SermonList";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
import { Paragraphs } from "../components/Paragraphs";
import { Icon, type IconName } from "../components/Icon";
function Section({
  icon,
  title,
  accent = false,
  children,
}: {
  icon: IconName;
  title: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`card reading-section fade${accent ? " accent" : ""}`}>
      <h2 className="section-title">
        <Icon name={icon} size={18} />
        {title}
      </h2>
      {children}
    </article>
  );
}
export default function ReadingScreen() {
  const { data, error } = useDailyReading();
  // Preaching on each chosen battle, for a quiet time to listen.
  const preached = useBattlePacks().filter((pack) => pack.sermons.length);
  const { data: featured } = useContent(loadFeaturedSermons);
  return (
    <Page
      title="Today's Reading"
      eyebrow={new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      back={{ to: "/", label: "Home" }}
    >
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          {data.lordsDay && (
            <Section icon="sun" title="The Lord's Day" accent>
              <h3 className="qa-question">{data.lordsDay.title}</h3>
              <Paragraphs text={data.lordsDay.text} />
            </Section>
          )}
          <Section icon="book" title="Scripture">
            <Scripture reference={data.verse} />
          </Section>
          <Section icon="message" title="Catechism">
            <h3 className="qa-question">{data.question.question}</h3>
            <p>{data.question.answer}</p>
            <small>{data.question.source}</small>
          </Section>
          <Section icon="pen" title="Counsel">
            <ContentReading reading={data.counsel} />
          </Section>
          {(preached.length > 0 || featured?.general.length) && (
            <Section icon="headphones" title="Hear the Word preached">
              {preached.map((pack, i) => (
                <details className="sermon-group" open={i === 0} key={pack.id}>
                  <summary>
                    {pack.name}
                    <span className="label">{pack.sermons.length}</span>
                  </summary>
                  <SermonList sermons={pack.sermons} />
                </details>
              ))}
              {featured && featured.general.length > 0 && (
                <details className="sermon-group" open={preached.length === 0}>
                  <summary>
                    Spiritual warfare and comfort
                    <span className="label">{featured.general.length}</span>
                  </summary>
                  <SermonList sermons={featured.general} />
                </details>
              )}
              <p className="label" style={{ marginTop: 12 }}>
                Preached by Shawn Anderson at Sycamore Reformed Presbyterian
                Church, Kokomo. Opens on SermonAudio.
              </p>
            </Section>
          )}
        </>
      ) : (
        !error && (
          <p className="label" role="status">
            Opening today's reading…
          </p>
        )
      )}
    </Page>
  );
}
