import { FaMapMarkerAlt, FaMedal, FaShoppingBag, FaInfoCircle } from "react-icons/fa";
import { formatWhen, driveStatus } from "../utils.js";

export default function EventCard({
  event,
  joined,
  busy,
  onJoin,
  onCancel,
  onDetails,
}) {
  const needed = event.capacity - event.registered;
  const full = needed <= 0;
  const status = driveStatus(event.date);
  const ended = status === "ended";

  return (
    <div className={`paw-card h-100 d-flex flex-column ${ended ? "ended" : ""}`}>
      <div
        className="cover-wrap"
        style={{ cursor: "pointer" }}
        onClick={() => onDetails(event._id)}
      >
        <img className="cover-img" src={event.image} alt={event.title} />
        <span className="cat-pill">{event.category}</span>
        {status === "today" && <span className="status-pill status-today">Today</span>}
        {ended && <span className="status-pill status-ended">Ended</span>}
      </div>

      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="when mb-1">{formatWhen(event.date, event.time)}</div>
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
          <p className={`needed mb-2 ${full || ended ? "full" : ""}`}>
            {ended
              ? "This drive has ended"
              : full
                ? "Drive full"
                : `${needed} of ${event.capacity} volunteers still needed`}
          </p>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary py-2"
              onClick={() => onDetails(event._id)}
            >
              <FaInfoCircle className="me-1" /> Details
            </button>
            {ended ? (
              <button className="btn btn-full flex-grow-1 py-2" disabled>
                Ended
              </button>
            ) : joined ? (
              <button
                className="btn btn-outline-primary flex-grow-1 py-2"
                disabled={busy}
                onClick={() => onCancel(event._id)}
              >
                {busy ? "Please wait..." : "Cancel my slot"}
              </button>
            ) : full ? (
              <button className="btn btn-full flex-grow-1 py-2" disabled>
                Full
              </button>
            ) : (
              <button
                className="btn btn-primary flex-grow-1 py-2"
                disabled={busy}
                onClick={() => onJoin(event._id)}
              >
                {busy ? "Please wait..." : "Join this drive"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}