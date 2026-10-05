import { NavLink } from "react-router-dom";
import { useMessages } from "../state/messages";
import { useAuth } from "../state/auth";
import { Icon } from "./Icon";
import { useIsSister } from "../brethren/words";
export function TabBar() {
  const sister = useIsSister();
  const user = useAuth((s) => s.user);
  const rows = useMessages((s) => s.rows);
  const unread = rows.some((m) => m.receiver_id === user?.id && !m.read);
  return (
    <nav className="tabs" aria-label="Main navigation">
      <NavLink to="/" end>
        <Icon name="home" />
        Home
      </NavLink>
      <NavLink to="/examine">
        <Icon name="pen" />
        Examine
      </NavLink>
      <NavLink to="/brethren">
        <Icon name="people" />
        {sister ? "Sisters" : "Brethren"}
        {unread && <span className="dot" aria-label="Unread messages" />}
      </NavLink>
      <NavLink to="/settings">
        <Icon name="sliders" />
        Settings
      </NavLink>
    </nav>
  );
}
