import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
export default function ProfileSetupScreen() {
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"brother" | "sister">("brother");
  const [church, setChurch] = useState("");
  const load = useBrethren((s) => s.load);
  const navigate = useNavigate();
  return (
    <Page title="Your brethren profile">
      <p>
        Use the name your church knows you by. Seek a small circle of believers
        in your own local church.
      </p>
      <label>
        Display name
        <input
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
