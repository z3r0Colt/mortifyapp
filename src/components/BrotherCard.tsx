import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile } from "../brethren/types";
import { cloud, result } from "../brethren/client";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { useBrethren } from "../state/brethren";
export function Initial({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
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
      style={{ padding: "14px 14px 14px 18px" }}
      onPointerDown={() => {
        timer.current = setTimeout(() => setMenu(true), 650);
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
    >
      <div className="person">
        <Link
          className="person-link"
          to={`/brethren/profile/${peer.id}`}
          onClick={(e) => {
            if (menu) e.preventDefault();
          }}
        >
          <Initial name={peer.display_name} />
          <span className="row-text">
            <strong>{peer.display_name}</strong>
            {peer.church_name && <span>{peer.church_name}</span>}
          </span>
        </Link>
        <button
          className="icon-button"
          aria-label={`Options for ${peer.display_name}`}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <Icon name="more" size={20} />
        </button>
      </div>
      {menu && (
        <div className="stack fade" style={{ marginTop: 14 }}>
          <Action
            run={async () => {
              await result(cloud().rpc("remove_link", { p_other: peer.id }));
              await load();
            }}
          >
            Remove from my {peer.sex === "sister" ? "sisters" : "brethren"}
          </Action>
        </div>
      )}
    </article>
  );
}
