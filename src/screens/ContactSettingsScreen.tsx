import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useBrethren } from "../state/brethren";
import { cloud, result } from "../brethren/client";
export default function ContactSettingsScreen() {
  const { profile, load } = useBrethren();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  return (
    <Page
      title="Phone for your circle"
      back={{ to: "/brethren", label: "Brethren" }}
      lede="A phone number is optional. Only accepted brethren can see it and call you from the flee sequence."
    >
      <label>
        Phone number (optional)
        <input
          type="tel"
          value={phone}
          maxLength={25}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <Action
        className="primary"
        run={async () => {
          await result(
            cloud()
              .from("profiles")
              .update({ phone: phone.trim() || null })
              .eq("id", profile!.id),
          );
          await load();
        }}
      >
        Save phone number
      </Action>
    </Page>
  );
}
