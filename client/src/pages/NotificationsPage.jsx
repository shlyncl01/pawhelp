import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotifications,
  errorMessage,
} from "../api.js";
import { timeAgo } from "../utils.js";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent) => {
    try {
      const res = await fetchNotifications();
      setItems(res.data.notifications);
      setUnread(res.data.unread);
    } catch (err) {
      if (!silent) setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const handleRead = async (n) => {
    if (n.read) return;
    setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await markNotificationRead(n._id);
    } catch {
      load(true);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await clearNotifications();
      setItems([]);
      setUnread(0);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
        <h2 className="section-title mb-0 me-auto">
          Notifications <span className="count">({unread} unread)</span>
        </h2>
        <button className="btn btn-outline-primary btn-sm" disabled={unread === 0} onClick={handleReadAll}>
          Mark all read
        </button>
        <button className="btn btn-outline-danger btn-sm" disabled={items.length === 0} onClick={handleClear}>
          Clear all
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="meta">You have no notifications.</p>
      ) : (
        <div className="paw-card">
          {items.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${n.read ? "" : "unread"}`}
              style={{ cursor: n.read ? "default" : "pointer" }}
              onClick={() => handleRead(n)}
            >
              <span className={`notif-dot ${n.read ? "read" : ""}`} />
              <span className="flex-grow-1">
                <span className="d-block">{n.message}</span>
                <span className="meta small">{timeAgo(n.createdAt)}</span>
              </span>
              {n.event && n.type !== "deleted" && (
                <Link className="btn btn-outline-primary btn-sm align-self-start" to={`/drives/${n.event}`}>
                  View drive
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}