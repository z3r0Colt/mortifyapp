import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile } from "../brethren/types";
import { cloud, result } from "../brethren/client";
import { Action } from "./Action";
import { useBrethren } from "../state/brethren";
export function BrotherCard({ peer }: { peer: Profile }) {
  const [menu, setMenu] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const load = useBrethren((s) => s.load);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  return (
    <article
      className="card"
      onPointerDown={() => {
        timer.current = setTimeout(() => setMenu(true), 650);
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
    >
      <Link
        to={`/brethren/profile/${peer.id}`}
        onClick={(e) => {
          if (menu) e.preventDefault();
        }}
      >
        <h2>{peer.display_name}</h2>
        {peer.church_name && <p>{peer.church_name}</p>}
      </Link>
      <button
        aria-label={`Options for ${peer.display_name}`}
        onClick={() => setMenu(!menu)}
      >
        Options
      </button>
      {menu && (
        <Action
          run={async () => {
            await result(cloud().rpc("remove_link", { p_other: peer.id }));
            await load();
          }}
        >
          Remove from my {peer.sex === "sister" ? "sisters" : "brethren"}
        </Action>
      )}
    </article>
  );
}
