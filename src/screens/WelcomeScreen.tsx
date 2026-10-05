import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { Icon, type IconName } from "../components/Icon";
import { useContent } from "../content/useContent";
import { loadBible } from "../bible/loader";
import { resolveReference } from "../bible/resolver";
import { useAuth } from "../state/auth";
const features: [IconName, string, string][] = [
  [
    "exit",
    "Flee in the hour of temptation",
    "One tap turns you to the Word, to prayer, and to your brethren.",
  ],
  [
    "book",
    "Morning reading, evening examination",
    "Scripture, the catechism and old counsel each day, and a quiet look back each night.",
  ],
  [
    "people",
    "A few brethren from your church",
    "A small closed circle who pray for you and ask how you are doing.",
  ],
  [
    "lock",
    "Private by design",
    "Your journal is encrypted with your PIN. Only you can read it.",
  ],
];
// The first thing anyone sees: what Mortify is and where it points.
export default function WelcomeScreen() {
  const user = useAuth((s) => s.user);
  const { data: bible } = useContent(loadBible);
  let verse = "";
  try {
    if (bible) verse = resolveReference(bible, "Romans 8:13").text;
  } catch {
    verse = "";
  }
  return (
    <Page
      bare
      className="welcome-page"
      eyebrow="Welcome to"
      title="Mortify"
      lede={
        <>
          Help to put sin to death by the Spirit, following John Owen's{" "}
          <em>Of the Mortification of Sin in Believers</em>.
        </>
      }
      bar={
        <img
          className="welcome-logo"
          src={`${import.meta.env.BASE_URL}icon-512.png`}
          alt=""
          width={112}
          height={112}
        />
      }
    >
      <div className="welcome fade">
        {verse && (
          <blockquote className="card verse-card welcome-verse">
            <p className="verse-text">{verse}</p>
            <span className="reference">Romans 8:13</span>
          </blockquote>
        )}
        <ul className="welcome-features">
          {features.map(([icon, title, text]) => (
            <li key={title}>
              <span className="tile">
                <Icon name={icon} size={20} />
              </span>
              <span>
                <strong>{title}</strong>
                <span className="row-detail">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="welcome-note">
          Mortify is not your Savior. It sends you to Christ, to his Word and
          prayer, to the Lord's Day, and to his people in your church.
        </p>
      </div>
      <div className="dock">
        <Link className="button primary" to="/onboarding/gospel">
          Begin
          <Icon name="arrow" size={18} />
        </Link>
        {!user && (
          <Link className="quiet" to="/onboarding/sign-in">
            I already have an account
          </Link>
        )}
      </div>
    </Page>
  );
}
