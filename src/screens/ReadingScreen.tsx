import type { ReactNode } from "react";
import { Page } from "../components/Page";
import { useDailyReading } from "../content/useDaily";
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
