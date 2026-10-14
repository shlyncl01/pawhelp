import { useCallback, useEffect, useState } from "react";
import {
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaRegEdit,
  FaRegTrashAlt,
  FaUsers,
  FaBullhorn,
  FaBan,
} from "react-icons/fa";
import {
  fetchMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelDrive,
  errorMessage,
} from "../api.js";
import { formatWhen, driveStatus } from "../utils.js";
import EventForm from "../components/EventForm.jsx";
import DriveModal from "../components/DriveModal.jsx";

export default function ManagePage() {
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async (silent) => {
    try {
      const res = await fetchMyEvents();
      setEvents(res.data);
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

  const resetForm = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  const handleSubmit = async (data) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (editing) {
        await updateEvent(editing._id, data);
        setSuccess("Drive updated. Volunteers were notified of any change to the date, time or location.");
      } else {
        const res = await createEvent(data);
        const count = res.data.seriesCount || 1;
        setSuccess(count > 1 ? `${count} weekly drives posted.` : "Drive posted.");
      }
      resetForm();
      await load(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setError("");
    setSuccess("");
    setEditing(event);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelDrive = async (event) => {
    const reason = window.prompt(
      `Cancel "${event.title}"?\n\nThe drive stays on record and volunteers are notified.\nReason (optional):`,
      ""
    );
    if (reason === null) return;
    setError("");
    setSuccess("");
    try {
      await cancelDrive(event._id, reason.trim());
      if (editing?._id === event._id) resetForm();
      setSuccess("Drive cancelled. Volunteers were notified.");
      await load(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleDelete = async (event) => {
    if (
      !window.confirm(
        `Delete "${event.title}"? This removes the drive and its sign-ups. Volunteers are notified. To keep a record, use Cancel instead.`
      )
    )
      return;
    setError("");
    setSuccess("");
    try {
      await deleteEvent(event._id);
      if (editing?._id === event._id) resetForm();
      if (viewing?.id === event._id) setViewing(null);
      setSuccess("Drive deleted.");
      await load(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const closeModal = useCallback(() => setViewing(null), []);
  const viewingEvent = viewing && events.find((e) => e._id === viewing.id);

  return (
    <>
      <h2 className="section-title mb-3">My Drives</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <EventForm
            key={formKey}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            saving={saving}
          />
        </div>

        <div className="col-12 col-lg-7">
          {loading ? (
            <p>Loading...</p>
          ) : events.length === 0 ? (
            <p className="meta">You have not posted any drives yet.</p>
          ) : (
            <div className="row g-3">
              {events.map((e) => {
                const status = driveStatus(e.date, e.status);
                const cancelled = status === "cancelled";
                const canCancel = status === "upcoming" || status === "today";
                return (
                  <div className="col-12 col-md-6" key={e._id}>
                    <div
                      className={`paw-card h-100 d-flex flex-column ${
                        cancelled ? "cancelled" : status === "ended" ? "ended" : ""
                      }`}
                    >
                      <div
                        className="cover-wrap"
                        style={{ cursor: "pointer" }}
                        onClick={() => setViewing({ id: e._id, tab: "details" })}
                      >
                        <img className="cover-img" src={e.image} alt={e.title} />
                        <span className="cat-pill">{e.category}</span>
                        {cancelled && <span className="status-pill status-cancelled">Cancelled</span>}
                        {status === "ended" && <span className="status-pill status-ended">Ended</span>}
                        {status === "today" && <span className="status-pill status-today">Today</span>}
                      </div>
                      <div className="p-3 d-flex flex-column flex-grow-1">
                        <h6 className="fw-bold">
                          {e.title}
                          {e.seriesId && (
                            <span className="mini-badge badge-series ms-2">Weekly series</span>
                          )}
                        </h6>
                        <p className="meta small mb-1">
                          <FaRegCalendarAlt className="me-2" />
                          {formatWhen(e.date, e.time, e.endTime)}
                        </p>
                        <p className="meta small mb-2">
                          <FaMapMarkerAlt className="me-2" />
                          {e.location}
                        </p>
                        <p className="needed small">
                          {e.registered} of {e.capacity} volunteers signed up
                        </p>
                        <div className="d-flex gap-2 flex-wrap mt-auto">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setViewing({ id: e._id, tab: "volunteers" })}
                          >
                            <FaUsers className="me-1" /> Attendees
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setViewing({ id: e._id, tab: "updates" })}
                          >
                            <FaBullhorn className="me-1" /> Updates
                          </button>
                          {!cancelled && (
                            <button className="btn btn-teal btn-sm" onClick={() => handleEdit(e)}>
                              <FaRegEdit className="me-1" /> Edit
                            </button>
                          )}
                          {canCancel && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleCancelDrive(e)}
                            >
                              <FaBan className="me-1" /> Cancel drive
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(e)}
                          >
                            <FaRegTrashAlt className="me-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewingEvent && (
        <DriveModal
          key={`${viewing.id}-${viewing.tab}`}
          event={viewingEvent}
          initialTab={viewing.tab}
          joined={false}
          busy={false}
          onJoin={() => {}}
          onCancel={() => {}}
          onClose={closeModal}
        />
      )}
    </>
  );
}