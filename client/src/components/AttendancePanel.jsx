import { useEffect, useState } from "react";
import { FaFileCsv, FaFilePdf } from "react-icons/fa";
import { fetchEventRegistrations, setAttendance, errorMessage } from "../api.js";
import { formatJoined, formatWhen } from "../utils.js";
import { downloadCsv, printTable, fileSlug } from "../exportUtils.js";

export default function AttendancePanel({ event }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetchEventRegistrations(event._id);
        if (!active) return;
        setList(res.data);
        setError("");
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [event._id, event.registered]);

  const toggle = async (reg) => {
    setBusyId(reg._id);
    setError("");
    try {
      const res = await setAttendance(event._id, reg._id, !reg.attended);
      setList((items) =>
        items.map((r) => (r._id === reg._id ? { ...r, attended: res.data.attended } : r))
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const joinedList = list.filter((r) => r.status !== "waitlist");
  const waitList = list.filter((r) => r.status === "waitlist");
  const present = joinedList.filter((r) => r.attended).length;
  const full = event.registered >= event.capacity;
  const percent = Math.min(100, (event.registered / event.capacity) * 100);

  const headers = ["Name", "Email", "Status", "Signed up", "Present"];
  const rows = list.map((r) => [
    r.user?.name || "Removed user",
    r.user?.email || "",
    r.status === "waitlist" ? "Waitlist" : "Joined",
    formatJoined(r.createdAt),
    r.status === "waitlist" ? "" : r.attended ? "Yes" : "No",
  ]);

  const exportCsv = () => downloadCsv(`${fileSlug(event.title)}-volunteers.csv`, headers, rows);
  const exportPdf = () =>
    printTable(
      `${event.title} - volunteers`,
      `${formatWhen(event.date, event.time, event.endTime)} · ${event.location}`,
      headers,
      rows
    );

  const renderPerson = (r, waiting) => (
    <li key={r._id} className="attendee">
      <span className="avatar">{(r.user?.name || "?").charAt(0).toUpperCase()}</span>
      <div className="flex-grow-1">
        <div className="fw-bold">{r.user?.name || "Removed user"}</div>
        <div className="meta small">{r.user?.email}</div>
        <div className="meta small">Signed up {formatJoined(r.createdAt)}</div>
      </div>
      {waiting ? (
        <span className="mini-badge badge-waitlist">Waitlist</span>
      ) : (
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id={`present-${r._id}`}
            checked={!!r.attended}
            disabled={busyId === r._id}
            onChange={() => toggle(r)}
          />
          <label className="form-check-label fw-bold small" htmlFor={`present-${r._id}`}>
            Present
          </label>
        </div>
      )}
    </li>
  );

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="needed">
          {event.registered} of {event.capacity} slots filled
        </span>
        <span className="live-dot ms-auto" title="Updates automatically" />
      </div>
      <div className="slot-bar mb-3">
        <div className={`slot-fill ${full ? "full" : ""}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
        <span className="fw-bold">
          {present} of {joinedList.length} present
        </span>
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={list.length === 0}
            onClick={exportCsv}
          >
            <FaFileCsv className="me-1" /> CSV
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={list.length === 0}
            onClick={exportPdf}
          >
            <FaFilePdf className="me-1" /> PDF
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p className="meta">Loading volunteers...</p>
      ) : list.length === 0 ? (
        <p className="meta">No volunteers have joined yet.</p>
      ) : (
        <>
          {joinedList.length > 0 && (
            <ul className="attendee-list">{joinedList.map((r) => renderPerson(r, false))}</ul>
          )}
          {waitList.length > 0 && (
            <>
              <div className="detail-label mt-3">Waitlist ({waitList.length})</div>
              <ul className="attendee-list">{waitList.map((r) => renderPerson(r, true))}</ul>
            </>
          )}
        </>
      )}
    </>
  );
}