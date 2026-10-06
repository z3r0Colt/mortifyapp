import { useState } from "react";
import { Page } from "../components/Page";
import { Icon } from "../components/Icon";
import { Action } from "../components/Action";
import { reinstallLatest, usePwa, type UpdateCheck } from "../state/pwa";
import { nativePlatform, isNative } from "../native/platform";
import { devicePlatform, isInstalled } from "../platform";
import { useCircleWords } from "../brethren/words";
const outside = (
  <span className="visually-hidden"> (opens outside Mortify)</span>
);
// A problem report is an email the user writes and sends himself. It carries
// the build and the kind of device so the trouble can be found, and nothing
// from his account or journal.
function problemReport() {
  const how = isNative()
    ? `${nativePlatform()} app`
    : `${devicePlatform()}, ${isInstalled() ? "installed" : "in the browser"}`;
  const body = [
    "What happened?",
    "",
    "",
    "What were you trying to do?",
    "",
    "",
    "----",
    `Mortify ${__APP_VERSION__} (${__BUILD_DATE__})`,
    `Device: ${how}`,
    `Browser: ${navigator.userAgent}`,
  ].join("\n");
  return `mailto:mortify@gentleking.org?subject=${encodeURIComponent(
    `Problem report, Mortify ${__APP_VERSION__}`,
  )}&body=${encodeURIComponent(body)}`;
}
// Contact, a plain account of the user's data, and where the content comes from.
export default function AboutScreen() {
  const { circle } = useCircleWords();
  const checkForUpdate = usePwa((s) => s.checkForUpdate);
  const [update, setUpdate] = useState<UpdateCheck | "checking" | null>(null);
  return (
    <Page
      title="About Mortify"
      back={{ to: "/settings", label: "Settings" }}
      lede="Help to put sin to death by the Spirit, following John Owen's Of the Mortification of Sin in Believers."
    >
      <h2 className="section-title">Help</h2>
      <article className="card">
        <p>
          Questions, trouble, or something that does not look right? Write to us
          and we will answer as soon as we can.
        </p>
        <div className="stack">
          <a className="button block" href="mailto:mortify@gentleking.org">
            <Icon name="mail" size={18} />
            mortify@gentleking.org
          </a>
          <a className="button block" href={problemReport()}>
            <Icon name="flag" size={18} />
            Report a problem
          </a>
        </div>
        <p className="label" style={{ marginTop: 12 }}>
          Mortify cannot give counsel or respond to emergencies. Speak with your
          pastor, and in danger call your local emergency number.
        </p>
      </article>
      <h2 className="section-title">Your data</h2>
      <article className="card">
        <ul className="checks">
          <li>
            <Icon name="lock" size={18} />
            Your journal, confessions and reflections are encrypted on your
            phone with your PIN before they are saved. No one else can read
            them, including those who run Mortify.
          </li>
          <li>
            <Icon name="check" size={18} />
            Your account keeps your email, your battles and times, your reading
            place, and when you used Flee, so they follow you to a new phone.
          </li>
          <li>
            <Icon name="people" size={18} />
            Your {circle} see only what you choose under My profile and sharing,
            and the messages you send them.
          </li>
          <li>
            <Icon name="check" size={18} />
            No ads, analytics or tracking. Your data is never sold.
          </li>
          <li>
            <Icon name="check" size={18} />
            Settings › Account › Delete my account removes all of it for good.
          </li>
        </ul>
        <a
          className="button block"
          href={`${import.meta.env.BASE_URL}privacy-policy/`}
          target="_blank"
          rel="noreferrer"
        >
          Read the privacy policy
          {outside}
        </a>
      </article>
      <h2 className="section-title">Sources</h2>
      <article className="card">
        <ul className="checks">
          <li>
            <Icon name="book" size={18} />
            <span>
              Scripture quotations are from the{" "}
              <a
                href="https://berean.bible/licensing.htm"
                target="_blank"
                rel="noreferrer"
              >
                Berean Standard Bible
                {outside}
              </a>{" "}
              (BSB), which is in the public domain.
            </span>
          </li>
          <li>
            <Icon name="book" size={18} />
            Counsel is quoted from public domain works of John Owen, Thomas
            Watson, John Bunyan and William Gurnall, as published by the
            Christian Classics Ethereal Library, and of Thomas Brooks and
            Richard Sibbes, from the Nichol editions of their works (1862–1866).
          </li>
          <li>
            <Icon name="book" size={18} />
            Catechism answers are from the Westminster Shorter Catechism (1647).
          </li>
          <li>
            <Icon name="headphones" size={18} />
            <span>
              Sermons are preached by{" "}
              <a
                href="https://www.sermonaudio.com/broadcasters/sycamorerpc/"
                target="_blank"
                rel="noreferrer"
              >
                Shawn Anderson
                {outside}
              </a>{" "}
              of Sycamore Reformed Presbyterian Church, Kokomo, Indiana,{" "}
              <a
                href="https://www.sermonaudio.com/speakers/10608"
                target="_blank"
                rel="noreferrer"
              >
                Barry York
                {outside}
              </a>
              ,{" "}
              <a
                href="https://www.sermonaudio.com/speakers/7649"
                target="_blank"
                rel="noreferrer"
              >
                Alistair Begg
                {outside}
              </a>{" "}
              of Truth For Life,{" "}
              <a
                href="https://www.sermonaudio.com/speakers/10822"
                target="_blank"
                rel="noreferrer"
              >
                R.C. Sproul
                {outside}
              </a>{" "}
              of Ligonier Ministries, and{" "}
              <a
                href="https://www.sermonaudio.com/speakers/12754"
                target="_blank"
                rel="noreferrer"
              >
                Derek Thomas
                {outside}
              </a>
              , and published on SermonAudio.
            </span>
          </li>
        </ul>
      </article>
      <h2 className="section-title">Updates</h2>
      <article className="card">
        <p className="label" style={{ marginTop: 0 }}>
          Version {__APP_VERSION__} · {__BUILD_DATE__}
        </p>
        <div className="stack">
          <Action
            run={async () => {
              setUpdate("checking");
              setUpdate(await checkForUpdate());
            }}
          >
            <Icon name="refresh" size={18} />
            Check for updates
          </Action>
        </div>
        {update && update !== "checking" && (
          <p role="status" style={{ marginTop: 12 }}>
            {
              {
                current: "You have the newest version.",
                updating: "Updating now…",
                offline: "Connect to the internet to check for updates.",
                unsupported:
                  "Updates arrive with the app itself here, not through Mortify.",
              }[update]
            }
          </p>
        )}
        <p className="label" style={{ marginTop: 18 }}>
          If an update will not install, reinstall the newest version. You stay
          signed in, and your journal and settings are kept.
        </p>
        <Action
          className="quiet"
          run={async () => {
            if (!navigator.onLine)
              throw new Error("Connect to the internet to reinstall.");
            await reinstallLatest();
          }}
        >
          Reinstall the newest version
        </Action>
      </article>
    </Page>
  );
}
