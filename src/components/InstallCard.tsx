import { useEffect, useState } from "react";
import { devicePlatform, isInstalled } from "../platform";
import { Action } from "./Action";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallCard() {
  const [prompt, setPrompt] = useState<InstallEvent>();
  const [installed, setInstalled] = useState(isInstalled());
  useEffect(() => {
    const before = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  if (installed) return null;
  return (
    <article className="card">
      <h2>Keep Mortify close at hand</h2>
      <p>
        Adding Mortify to your home screen lets you open its readings without an
        internet connection after the offline files are saved.
      </p>
      {devicePlatform() === "ios" ? (
        <p>
          In Safari, open Share, choose Add to Home Screen, then Add. Turn on
          Open as Web App if shown.
        </p>
      ) : prompt ? (
        <Action
          run={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(undefined);
          }}
        >
          Add to home screen
        </Action>
      ) : (
        <p>
          Open your browser menu and choose Install app or Add to Home Screen.
        </p>
      )}
    </article>
  );
}
