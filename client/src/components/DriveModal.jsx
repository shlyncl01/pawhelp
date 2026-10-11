import { useEffect, useState } from "react";
import {
    FaTimes,
    FaMapMarkerAlt,
    FaRegCalendarAlt,
    FaMedal,
    FaShoppingBag,
    FaBuilding,
    FaUsers,
    FaInfoCircle,
} from "react-icons/fa";
import { fetchEventRegistrations, errorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatWhen, formatJoined, driveStatus } from "../utils.js";
export default function DriveModal({
    event,
    joined,
    busy,
    onJoin,
    onCancel,
    onClose,
    initialTab = "details",
}) {
    const { user } = useAuth();
    const isOwner = String(event.createdBy) === String(user._id);
    const canSeeList = isOwner || user.role === "admin";
    const needed = event.capacity - event.registered;
    const full = needed <= 0;
    const ended = driveStatus(event.date) === "ended";
    const percent = Math.min(100, (event.registered / event.capacity) * 100);

    const [tab, setTab] = useState(canSeeList ? initialTab : "details");
    const [attendees, setAttendees] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState("");

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    useEffect(() => {
        if (!canSeeList || tab !== "volunteers") return;
        let active = true;
        const load = async () => {
            try {
                const res = await fetchEventRegistrations(event._id);
                if (!active) return;
                setAttendees(res.data);
                setListError("");
            } catch (err) {
                if (active) setListError(errorMessage(err));
            } finally {
                if (active) setLoadingList(false);
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
    }, [canSeeList, tab, event._id, event.registered]);

    return (
        <div className="modal-backdrop-paw" onClick={onClose}>
            <div
                className="drive-modal"
                role="dialog"
                aria-modal="true"
                aria-label={event.title}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    <FaTimes />
                </button>

                <div className="cover-wrap">
                    <img className="modal-cover" src={event.image} alt={event.title} />
                    <span className="cat-pill">{event.category}</span>
                </div>

                <div className="p-4">
                    <div className="when mb-1">{formatWhen(event.date, event.time)}</div>
                    <h3 className="fw-bold mb-3">{event.title}</h3>

                    {canSeeList && (
                        <div className="modal-tabs" role="tablist">
                            <button
                                role="tab"
                                aria-selected={tab === "details"}
                                className={`modal-tab ${tab === "details" ? "active" : ""}`}
                                onClick={() => setTab("details")}
                            >
                                <FaInfoCircle className="me-2" />
                                Details
                            </button>
                            <button
                                role="tab"
                                aria-selected={tab === "volunteers"}
                                className={`modal-tab ${tab === "volunteers" ? "active" : ""}`}
                                onClick={() => setTab("volunteers")}
                            >
                                <FaUsers className="me-2" />
                                Volunteers ({event.registered})
                            </button>
                        </div>
                    )}

                    {tab === "details" && (
                        <>
                            <div className="detail-row">
                                <FaBuilding className="detail-icon" />
                                <div>
                                    <div className="detail-label">Organizer</div>
                                    {event.organization}
                                </div>
                            </div>
                            <div className="detail-row">
                                <FaRegCalendarAlt className="detail-icon" />
                                <div>
                                    <div className="detail-label">When</div>
                                    {formatWhen(event.date, event.time)}
                                </div>
                            </div>
                            <div className="detail-row">
                                <FaMapMarkerAlt className="detail-icon" />
                                <div>
                                    <div className="detail-label">Where</div>
                                    {event.location}
                                </div>
                            </div>
                            <div className="detail-row">
                                <FaMedal className="detail-icon" />
                                <div>
                                    <div className="detail-label">Experience needed</div>
                                    {event.experience}
                                </div>
                            </div>
                            {event.whatToBring && (
                                <div className="detail-row">
                                    <FaShoppingBag className="detail-icon" />
                                    <div>
                                        <div className="detail-label">What to bring</div>
                                        {event.whatToBring}
                                    </div>
                                </div>
                            )}

                            {event.description && (
                                <>
                                    <div className="detail-label mt-3">About this drive</div>
                                    <p className="mb-3">{event.description}</p>
                                </>
                            )}

                            <div className="slot-bar mt-3">
                                <div
                                    className={`slot-fill ${full ? "full" : ""}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <p className={`needed mt-2 mb-3 ${full || ended ? "full" : ""}`}>
                                {ended
                                    ? "This drive has ended"
                                    : full
                                        ? "Drive full"
                                        : `${needed} of ${event.capacity} volunteers still needed`}
                                <span className="meta fw-normal ms-2">
                                    ({event.registered} signed up)
                                </span>
                            </p>

                            {isOwner ? (
                                <div className="owner-note">You organize this drive.</div>
                            ) : ended ? (
                                <button className="btn btn-full w-100 py-2" disabled>
                                    Drive ended
                                </button>
                            ) : joined ? (
                                <button
                                    className="btn btn-outline-primary w-100 py-2"
                                    disabled={busy}
                                    onClick={() => onCancel(event._id)}
                                >
                                    {busy ? "Please wait..." : "Cancel my slot"}
                                </button>
                            ) : full ? (
                                <button className="btn btn-full w-100 py-2" disabled>
                                    Full
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary w-100 py-2"
                                    disabled={busy}
                                    onClick={() => onJoin(event._id)}
                                >
                                    {busy ? "Please wait..." : "Join this drive"}
                                </button>
                            )}
                        </>
                    )}

                    {tab === "volunteers" && canSeeList && (
                        <>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="needed">
                                    {event.registered} of {event.capacity} slots filled
                                </span>
                                <span className="live-dot ms-auto" title="Updates automatically" />
                            </div>
                            <div className="slot-bar mb-3">
                                <div
                                    className={`slot-fill ${full ? "full" : ""}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            {listError && <div className="alert alert-danger">{listError}</div>}
                            {loadingList ? (
                                <p className="meta">Loading volunteers...</p>
                            ) : attendees.length === 0 ? (
                                <p className="meta">No volunteers have joined yet.</p>
                            ) : (
                                <ul className="attendee-list">
                                    {attendees.map((r) => (
                                        <li key={r._id} className="attendee">
                                            <span className="avatar">
                                                {(r.user?.name || "?").charAt(0).toUpperCase()}
                                            </span>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">{r.user?.name || "Removed user"}</div>
                                                <div className="meta small">{r.user?.email}</div>
                                            </div>
                                            <div className="meta small text-end">
                                                Joined {formatJoined(r.createdAt)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}