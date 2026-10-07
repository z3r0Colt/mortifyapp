import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
import { Icon } from "../components/Icon";
import { usePreferences } from "../state/preferences";
import { ListGroup, SwitchRow } from "../components/List";
import { sharingChoices, type SharingKey } from "../brethren/sharing";
import { useAuth } from "../state/auth";
const points = [
  "A small closed circle of up to eight believers, ideally from your own church.",
  "Brothers link with brothers and sisters with sisters, only by a private code.",
  "No public feed and no strangers.",
  "You choose what they see. Your journal and confessions are never shared.",
];
export default function ProfileSetupScreen() {
  const [name, setName] = useState("");
  // Asked at onboarding; only older accounts choose here.
  const known = usePreferences((s) => s.value.sex);
  const [sex, setSex] = useState<"brother" | "sister">(known ?? "brother");
  const [church, setChurch] = useState("");
  // Chosen here, before anyone is linked, so nothing is shown that the
  // user has not seen and agreed to. Changeable later under Sharing.
  const [sharing, setSharing] = useState<Record<SharingKey, boolean>>({
    share_battles: true,
    share_temptations: true,
    share_falls: false,
    share_blocker_status: true,
  });
  const user = useAuth((s) => s.user);
  const load = useBrethren((s) => s.load);
  const navigate = useNavigate();
  return (
    <Page
      title={
        sex === "sister" ? "Your profile for sisters" : "Your brethren profile"
      }
      lede="Watch over one another in prayer with a few believers you already know."
    >
      <article className="card">
        <ul className="checks">
          {points.map((point) => (
            <li key={point}>
              <Icon name="check" size={18} />
              {point}
            </li>
          ))}
        </ul>
      </article>
      <h2 className="section-title">Your profile</h2>
      <p className="label">Use the name your church knows you by.</p>
      <label>
        Display name
        <input
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {!known && (
        <label>
          Brother or sister
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as "brother" | "sister")}
          >
            <option value="brother">Brother</option>
            <option value="sister">Sister</option>
          </select>
        </label>
      )}
      <label>
        Church name (optional)
        <input
          maxLength={120}
          value={church}
          onChange={(e) => setChurch(e.target.value)}
        />
      </label>
      <ListGroup title="What they may see">
        {sharingChoices.map(([key, title, description]) => (
          <SwitchRow
            key={key}
            label={title}
            detail={description}
            checked={sharing[key]}
            onChange={async (on) => setSharing({ ...sharing, [key]: on })}
          />
        ))}
      </ListGroup>
      <p className="hint">
        Your journal and confessions are never shared. You can change these
        choices at any time.
      </p>
      <Action
        className="primary"
        run={async () => {
          if (!name.trim()) throw new Error("Enter a display name.");
          await result(
            cloud().rpc("create_profile", {
              p_name: name.trim(),
              p_sex: sex,
              p_church: church.trim() || null,
            }),
          );
          // The profile now exists, so a failure here must not leave the
          // user stuck on setup: send him to Sharing to choose again.
          const chosen = await result(
            cloud()
              .from("shared_settings")
              .update(sharing)
              .eq("user_id", user!.id),
          ).then(
            () => true,
            () => false,
          );
          await load();
          navigate(chosen ? "/brethren" : "/brethren/sharing", {
            replace: true,
          });
        }}
      >
        Save profile
      </Action>
    </Page>
  );
}
