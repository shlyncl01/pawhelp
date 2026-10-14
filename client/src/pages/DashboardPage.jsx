import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import {
  fetchMyEvents,
  fetchMyRegistrations,
  cancelEvent,
  errorMessage,
} from "../api.js";
import DriveBrowser from "../components/DriveBrowser.jsx";
import { driveStatus, driveHours, formatHours, formatWhen } from "../utils.js";

const rowStatus = (r) => {
  const s = driveStatus(r.event.date, r.event.status);
  if (s === "cancelled") return { text: "Cancelled", cls: "badge-cancelled" };
  if (r.status === "waitlist") {
    return s === "ended"
      ? { text: "Waitlist ended", cls: "badge-ended" }
      : { text: "Waitlisted", cls: "badge-waitlist" };
  }
  if (s === "ended") {
    return r.attended
      ? { text: "Attended", cls: "badge-present" }
      : { text: "Not checked in", cls: "badge-ended" };
  }
  return { text: s === "today" ? "Today" : "Upcoming", cls: "badge-upcoming" };
};

export default function DashboardPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [joined, setJoined] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [browserKey, setBrowserKey] = useState(0);
  const [heroOk, setHeroOk] = useState(true);

  const load = async () => {
    try {
      const [mine, regs] = await Promise.all([fetchMyEvents(), fetchMyRegistrations()]);
      setMyEvents(mine.data);
      setJoined(regs.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (eventId, waiting) => {
    setError("");
    setSuccess("");
    setBusyId(eventId);
    try {
      await cancelEvent(eventId);
      setSuccess(waiting ? "You left the waitlist." : "Your spot was cancelled.");
      await load();
      setBrowserKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const signedUp = myEvents
    .filter((e) => e.status !== "cancelled")
    .reduce((sum, e) => sum + e.registered, 0);
  const confirmed = joined.filter((r) => r.status !== "waitlist");
  const attended = confirmed.filter((r) => r.attended);
  const hours = attended.reduce(
    (sum, r) => sum + driveHours(r.event.time, r.event.endTime),
    0
  );
  const upcoming = confirmed.filter((r) =>
    ["upcoming", "today"].includes(driveStatus(r.event.date, r.event.status))
  ).length;

  const stats = [
    { label: "Drives I organize", value: myEvents.length, color: "stat-orange" },
    { label: "Volunteers signed up", value: signedUp, color: "stat-orange" },
    { label: "Drives I joined", value: confirmed.length, color: "stat-teal" },
    { label: "My upcoming drives", value: upcoming, color: "stat-teal" },
    { label: "Drives attended", value: attended.length, color: "stat-teal" },
    { label: "Hours volunteered", value: formatHours(hours), color: "stat-teal" },
  ];

  const history = [...joined].sort((a, b) => b.event.date.localeCompare(a.event.date));

  return (
    <>
      <section className="hero mb-4">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-6">
            <div className="hero-eyebrow mb-2">Volunteer drives for animals</div>
            <h1 className="display-5 mb-3">Find a drive. Lend a hand. Change a tail.</h1>
            <p className="mb-4">
              Shelters and rescuers post volunteer drives. You pick one, reserve a
              slot, and show up ready to help.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/drives" className="btn btn-light btn-lg">Browse Drives</Link>
              <Link to="/my-drives" className="btn btn-outline-light btn-lg">Post a Drive</Link>
            </div>
          </div>
          <div className="col-lg-6 d-none d-lg-block">
            {heroOk ? (
              <img
                src="/hero.jpg"
                alt="Volunteer walking a shelter dog"
                className="hero-photo"
                onError={() => setHeroOk(false)}
              />
            ) : (
              <div className="hero-photo d-flex">
                <FaPaw size={96} />
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-3 mb-5">
        {stats.map((s) => (
          <div className="col-6 col-md-4 col-lg-2" key={s.label}>
            <div className="stat-card">
              <div className={`stat-number ${s.color}`}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <DriveBrowser key={browserKey} title="Upcoming Drives" onChange={load} />

      <h2 className="section-title mt-5 mb-3">My participation</h2>
      {history.length === 0 ? (
        <p className="meta">
          You have not joined any drives yet. <Link to="/drives">Browse drives</Link>
        </p>
      ) : (
        <div className="table-responsive paw-card">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Drive</th>
                <th>When</th>
                <th>Location</th>
                <th>Status</th>
                <th>Hours</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => {
                const st = rowStatus(r);
                const s = driveStatus(r.event.date, r.event.status);
                const canCancel = s === "upcoming" || s === "today";
                const waiting = r.status === "waitlist";
                return (
                  <tr key={r._id}>
                    <td className="fw-bold">
                      <Link to={`/drives/${r.event._id}`}>{r.event.title}</Link>
                    </td>
                    <td>{formatWhen(r.event.date, r.event.time, r.event.endTime)}</td>
                    <td>{r.event.location}</td>
                    <td>
                      <span className={`mini-badge ${st.cls}`}>{st.text}</span>
                    </td>
                    <td>
                      {r.attended && !waiting
                        ? formatHours(driveHours(r.event.time, r.event.endTime))
                        : "–"}
                    </td>
                    <td className="text-end">
                      {canCancel && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={busyId === r.event._id}
                          onClick={() => handleCancel(r.event._id, waiting)}
                        >
                          {busyId === r.event._id
                            ? "Please wait..."
                            : waiting
                              ? "Leave waitlist"
                              : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}