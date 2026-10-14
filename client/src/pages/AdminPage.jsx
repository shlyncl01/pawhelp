import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminEvents,
  updateUserRole,
  deleteUser,
  deleteEvent,
  cancelDrive,
  errorMessage,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatWhen, formatJoined, driveStatus } from "../utils.js";

const STATUS_BADGE = {
  cancelled: ["Cancelled", "badge-cancelled"],
  ended: ["Ended", "badge-ended"],
  today: ["Today", "badge-present"],
  upcoming: ["Upcoming", "badge-upcoming"],
};

export default function AdminPage() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("users");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, u, e] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminEvents(),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setEvents(e.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, message) => {
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleRole = (u, role) => {
    if (!window.confirm(`Change ${u.name} to ${role}?`)) return;
    run(() => updateUserRole(u._id, role), `${u.name} is now ${role}.`);
  };

  const handleDeleteUser = (u) => {
    if (
      !window.confirm(
        `Delete ${u.name}? This also deletes their drives and sign-ups. This cannot be undone.`
      )
    )
      return;
    run(() => deleteUser(u._id), "User deleted.");
  };

  const handleCancelDrive = (e) => {
    const reason = window.prompt(
      `Cancel "${e.title}"? Volunteers are notified.\nReason (optional):`,
      ""
    );
    if (reason === null) return;
    run(() => cancelDrive(e._id, reason.trim()), "Drive cancelled.");
  };

  const handleDeleteDrive = (e) => {
    if (!window.confirm(`Delete "${e.title}"? This removes its sign-ups.`)) return;
    run(() => deleteEvent(e._id), "Drive deleted.");
  };

  const q = query.trim().toLowerCase();
  const shownUsers = users.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  const shownEvents = events.filter(
    (e) =>
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.createdBy?.name || "").toLowerCase().includes(q)
  );

  const cards = stats
    ? [
        { label: "Users", value: stats.users, color: "stat-orange" },
        { label: "Drives", value: stats.events, color: "stat-orange" },
        { label: "Upcoming drives", value: stats.upcoming, color: "stat-teal" },
        { label: "Sign-ups", value: stats.registrations, color: "stat-teal" },
        { label: "Cancelled drives", value: stats.cancelled, color: "stat-red" },
      ]
    : [];

  return (
    <>
      <h2 className="section-title mb-3">Admin</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {cards.map((c) => (
              <div className="col-6 col-md-4 col-lg" key={c.label}>
                <div className="stat-card">
                  <div className={`stat-number ${c.color}`}>{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
            <div className="modal-tabs mb-0 me-auto" role="tablist">
              <button
                role="tab"
                className={`modal-tab ${tab === "users" ? "active" : ""}`}
                onClick={() => setTab("users")}
              >
                Users ({users.length})
              </button>
              <button
                role="tab"
                className={`modal-tab ${tab === "drives" ? "active" : ""}`}
                onClick={() => setTab("drives")}
              >
                Drives ({events.length})
              </button>
            </div>
            <input
              className="form-control"
              style={{ maxWidth: 260 }}
              placeholder={tab === "users" ? "Search name or email..." : "Search title or organizer..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {tab === "users" && (
            <div className="table-responsive paw-card">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Organized</th>
                    <th>Joined</th>
                    <th>Registered</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {shownUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="meta text-center">No users found.</td>
                    </tr>
                  ) : (
                    shownUsers.map((u) => {
                      const isMe = String(u._id) === String(me._id);
                      return (
                        <tr key={u._id}>
                          <td className="fw-bold">{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span
                              className={`mini-badge ${
                                u.role === "admin" ? "badge-present" : "badge-ended"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>{u.organized}</td>
                          <td>{u.joined}</td>
                          <td>{formatJoined(u.createdAt)}</td>
                          <td className="text-end text-nowrap">
                            {isMe ? (
                              <span className="meta small">You</span>
                            ) : (
                              <>
                                <button
                                  className="btn btn-outline-primary btn-sm me-2"
                                  onClick={() =>
                                    handleRole(u, u.role === "admin" ? "user" : "admin")
                                  }
                                >
                                  {u.role === "admin" ? "Make user" : "Make admin"}
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteUser(u)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "drives" && (
            <div className="table-responsive paw-card">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Drive</th>
                    <th>Organizer</th>
                    <th>When</th>
                    <th>Status</th>
                    <th>Volunteers</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {shownEvents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="meta text-center">No drives found.</td>
                    </tr>
                  ) : (
                    shownEvents.map((e) => {
                      const status = driveStatus(e.date, e.status);
                      const [label, cls] = STATUS_BADGE[status];
                      const canCancel = status === "upcoming" || status === "today";
                      return (
                        <tr key={e._id}>
                          <td className="fw-bold">
                            <Link to={`/drives/${e._id}`}>{e.title}</Link>
                          </td>
                          <td>{e.createdBy?.name || "Removed user"}</td>
                          <td>{formatWhen(e.date, e.time, e.endTime)}</td>
                          <td>
                            <span className={`mini-badge ${cls}`}>{label}</span>
                          </td>
                          <td>
                            {e.registered} / {e.capacity}
                          </td>
                          <td className="text-end text-nowrap">
                            {canCancel && (
                              <button
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={() => handleCancelDrive(e)}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteDrive(e)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}