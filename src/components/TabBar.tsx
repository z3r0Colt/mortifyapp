import { NavLink } from "react-router-dom";
import { useBrethren } from "../state/brethren";
import { useMessages } from "../state/messages";
import { useAuth } from "../state/auth";
export function TabBar() {
  const sister = useBrethren((s) => s.profile?.sex === "sister");
  const user = useAuth((s) => s.user);
  const rows = useMessages((s) => s.rows);
  const unread = rows.some((m) => m.receiver_id === user?.id && !m.read);
  return (
    <nav className="tabs" aria-label="Main navigation">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/examine">Examine</NavLink>
      <NavLink to="/brethren">
        {sister ? "Sisters" : "Brethren"}
        {unread && <span className="dot" aria-label="Unread messages" />}
      </NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  );
}
