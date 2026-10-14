import { FaMapMarkerAlt, FaMedal, FaShoppingBag, FaInfoCircle } from "react-icons/fa";
import { formatWhen, driveStatus } from "../utils.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function EventCard({
  event,
  joined,
  waitlisted = false,
  busy,
  onJoin,
  onCancel,
  onDetails,
}) {
  const { user } = useAuth();
  const needed = event.capacity - event.registered;
  const full = needed <= 0;
  const status = driveStatus(event.date, event.status);
  const ended = status === "ended";
  const cancelled = status === "cancelled";
  const closed = ended || cancelled;

  let message;
  if (cancelled) message = "This drive was cancelled";
  else if (ended) message = "This drive has ended";
  else if (full) message = "Drive full · waitlist open";
  else message = `${needed} of ${event.capacity} volunteers still needed`;

  let action;
  if (cancelled) {
    action = (
      <button className="btn btn-full flex-grow-1 py-2" disabled>
        Cancelled
      </button>
    );
  } else if (ended) {
    action = (
      <button className="btn btn-full flex-grow-1 py-2" disabled>
        Ended
      </button>
    );
  } else if (joined) {
    action = (
      <button
        className="btn btn-outline-primary flex-grow-1 py-2"
        disabled={busy}
        onClick={() => onCancel(event._id)}
      >
        {busy ? "Please wait..." : "Cancel my slot"}
      </button>
    );
  } else if (waitlisted) {
    action = (
      <button
        className="btn btn-outline-primary flex-grow-1 py-2"
        disabled={busy}
        onClick={() => onCancel(event._id)}
      >
        {busy ? "Please wait..." : "Leave waitlist"}
      </button>
    );
  } else if (full) {
    action = (
      <button
        className="btn btn-teal flex-grow-1 py-2"
        disabled={busy}
        onClick={() => onJoin(event._id)}
      >
        {busy ? "Please wait..." : user ? "Join waitlist" : "Log in to join"}
      </button>
    );
  } else {
    action = (
      <button
        className="btn btn-primary flex-grow-1 py-2"
        disabled={busy}
        onClick={() => onJoin(event._id)}
      >
        {busy ? "Please wait..." : user ? "Join this drive" : "Log in to join"}
      </button>
    );
  }

  return (
    <div className={`paw-card h-100 d-flex flex-column ${closed ? "ended" : ""}`}>
      <div
        className="cover-wrap"
        style={{ cursor: "pointer" }}
        onClick={() => onDetails(event._id)}
      >
        <img className="cover-img" src={event.image} alt={event.title} />
        <span className="cat-pill">{event.category}</span>
        {cancelled && <span className="status-pill status-cancelled">Cancelled</span>}
        {!cancelled && ended && <span className="status-pill status-ended">Ended</span>}
        {status === "today" && <span className="status-pill status-today">Today</span>}
      </div>

      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="when mb-1">{formatWhen(event.date, event.time, event.endTime)}</div>
        <h5 className="fw-bold mb-1">{event.title}</h5>
        <p className="meta mb-1">{event.organization}</p>
        <p className="meta small mb-1">
          <FaMapMarkerAlt className="me-2" />
          {event.location}
        </p>
        <p className="meta small mb-1">
          <FaMedal className="me-2" />
          Experience: {event.experience}
        </p>
        {event.whatToBring && (
          <p className="meta small mb-1">
            <FaShoppingBag className="me-2" />
            Bring: {event.whatToBring}
          </p>
        )}
        {event.description && (
          <p className="meta mt-2 mb-2 clamp-3">{event.description}</p>
        )}

        <div className="mt-auto pt-2">
          <p className={`needed mb-2 ${full || closed ? "full" : ""}`}>{message}</p>
          {waitlisted && !closed && (
            <p className="waitlist-note small mb-2">You are on the waitlist</p>
          )}

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary py-2"
              onClick={() => onDetails(event._id)}
            >
              <FaInfoCircle className="me-1" /> Details
            </button>
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}