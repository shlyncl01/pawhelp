import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotifications,
} from "../api.js";
import { timeAgo } from "../utils.js";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      setItems(res.data.notifications);
      setUnread(res.data.unread);
    } catch {
      /* ignore, the next poll will try again */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const handleItem = async (n) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      try {
        await markNotificationRead(n._id);
      } catch {
        load();
      }
    }
    if (n.event && n.type !== "deleted") {
      setOpen(false);
      navigate(`/drives/${n.event}`);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      load();
    }
  };

  const handleClear = async () => {
    try {
      await clearNotifications();
      setItems([]);
      setUnread(0);
    } catch {
      load();
    }
  };

  return (
    <div className="bell-wrap" ref={boxRef}>
      <button
        type="button"
        className="bell-btn"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={toggle}
      >
        <FaBell />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong className="me-auto">Notifications</strong>
            {unread > 0 && (
              <button type="button" className="notif-link" onClick={handleReadAll}>
                Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button type="button" className="notif-link" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">You have no notifications.</div>
          ) : (
            items.map((n) => (
              <button
                type="button"
                key={n._id}
                className={`notif-item ${n.read ? "" : "unread"}`}
                onClick={() => handleItem(n)}
              >
                <span className={`notif-dot ${n.read ? "read" : ""}`} />
                <span>
                  <span className="d-block">{n.message}</span>
                  <span className="meta small">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))
          )}

          <div className="text-center p-2">
            <Link className="notif-link" to="/notifications" onClick={() => setOpen(false)}>
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}