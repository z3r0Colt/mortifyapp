import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
import { Icon } from "../components/Icon";
import { usePreferences } from "../state/preferences";
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
          await load();
          navigate("/brethren", { replace: true });
        }}
      >
        Save profile
      </Action>
    </Page>
  );
}
