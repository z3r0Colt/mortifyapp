import { useState } from "react";
import { Page } from "../components/Page";
import { Icon } from "../components/Icon";
import { Action } from "../components/Action";
import { reinstallLatest, usePwa, type UpdateCheck } from "../state/pwa";
const outside = (
  <span className="visually-hidden"> (opens outside Mortify)</span>
);
// Contact, a plain account of the user's data, and where the content comes from.
export default function AboutScreen() {
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
        <a className="button block" href="mailto:mortify@gentleking.org">
          <Icon name="mail" size={18} />
          mortify@gentleking.org
        </a>
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
            Your brethren see only what you choose under My profile and sharing,
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
            Watson and John Bunyan, as published by the Christian Classics
            Ethereal Library.
          </li>
          <li>
            <Icon name="book" size={18} />
            Catechism answers are from the Westminster Shorter Catechism (1647).
          </li>
          <li>
            <Icon name="headphones" size={18} />
            <span>
              Sermons are preached by Shawn Anderson of Sycamore Reformed
              Presbyterian Church, Kokomo, Indiana, and published on{" "}
              <a
                href="https://www.sermonaudio.com/broadcasters/sycamorerpc/"
                target="_blank"
                rel="noreferrer"
              >
                SermonAudio
                {outside}
              </a>
              .
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
