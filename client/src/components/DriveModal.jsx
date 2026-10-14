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
  FaBullhorn,
  FaLink,
  FaCheck,
} from "react-icons/fa";
import { fetchEvent } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatWhen, formatJoined, driveStatus, driveLink } from "../utils.js";
import AttendancePanel from "./AttendancePanel.jsx";
import AnnouncementsPanel from "./AnnouncementsPanel.jsx";

export default function DriveModal({
  event,
  joined,
  waitlisted = false,
  busy,
  onJoin,
  onCancel,
  onClose,
  initialTab = "details",
  notice = null,
}) {
  const { user } = useAuth();
  const isOwner = !!user && String(event.createdBy) === String(user._id);
  const canSeeList = isOwner || user?.role === "admin";
  const needed = event.capacity - event.registered;
  const full = needed <= 0;
  const status = driveStatus(event.date, event.status);
  const ended = status === "ended";
  const cancelled = status === "cancelled";
  const closed = ended || cancelled;
  const percent = Math.min(100, (event.registered / event.capacity) * 100);

  const [tab, setTab] = useState(canSeeList ? initialTab : "details");
  const [announcements, setAnnouncements] = useState(event.announcements || []);
  const [copied, setCopied] = useState(false);

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
    let active = true;
    fetchEvent(event._id)
      .then((res) => {
        if (active) setAnnouncements(res.data.announcements || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [event._id, event.registered, event.status]);

  const copyLink = async () => {
    const link = driveLink(event._id);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Copy this link:", link);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    ["details", FaInfoCircle, "Details"],
    ["volunteers", FaUsers, `Volunteers (${event.registered})`],
    ["updates", FaBullhorn, "Updates"],
  ];

  let statusText;
  if (cancelled) statusText = "This drive was cancelled";
  else if (ended) statusText = "This drive has ended";
  else if (full) statusText = "Drive full · waitlist open";
  else statusText = `${needed} of ${event.capacity} volunteers still needed`;

  let action;
  if (cancelled) {
    action = (
      <button className="btn btn-full w-100 py-2" disabled>
        Drive cancelled
      </button>
    );
  } else if (isOwner) {
    action = <div className="owner-note">You organize this drive.</div>;
  } else if (ended) {
    action = (
      <button className="btn btn-full w-100 py-2" disabled>
        Drive ended
      </button>
    );
  } else if (joined) {
    action = (
      <button
        className="btn btn-outline-primary w-100 py-2"
        disabled={busy}
        onClick={() => onCancel(event._id)}
      >
        {busy ? "Please wait..." : "Cancel my slot"}
      </button>
    );
  } else if (waitlisted) {
    action = (
      <button
        className="btn btn-outline-primary w-100 py-2"
        disabled={busy}
        onClick={() => onCancel(event._id)}
      >
        {busy ? "Please wait..." : "Leave waitlist"}
      </button>
    );
  } else {
    action = (
      <button
        className={`btn ${full ? "btn-teal" : "btn-primary"} w-100 py-2`}
        disabled={busy}
        onClick={() => onJoin(event._id)}
      >
        {busy
          ? "Please wait..."
          : !user
            ? "Log in to join"
            : full
              ? "Join waitlist"
              : "Join this drive"}
      </button>
    );
  }

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
          <div className="when mb-1">{formatWhen(event.date, event.time, event.endTime)}</div>
          <h3 className="fw-bold mb-3">{event.title}</h3>

          {cancelled && (
            <div className="cancel-banner">
              This drive was cancelled.
              {event.cancelReason && (
                <div className="fw-normal">Reason: {event.cancelReason}</div>
              )}
            </div>
          )}

          {canSeeList && (
            <div className="modal-tabs" role="tablist">
              {tabs.map(([key, Icon, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  className={`modal-tab ${tab === key ? "active" : ""}`}
                  onClick={() => setTab(key)}
                >
                  <Icon className="me-2" />
                  {label}
                </button>
              ))}
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
                  {formatWhen(event.date, event.time, event.endTime)}
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

              {announcements.length > 0 && (
                <div className="mb-3">
                  <div className="detail-label mb-2">
                    <FaBullhorn className="me-2" />
                    Updates from the organizer
                  </div>
                  {[...announcements].reverse().map((a) => (
                    <div className="announce-item" key={a._id}>
                      <div>{a.message}</div>
                      <div className="meta small">{formatJoined(a.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="slot-bar mt-3">
                <div
                  className={`slot-fill ${full ? "full" : ""}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className={`needed mt-2 mb-3 ${full || closed ? "full" : ""}`}>
                {statusText}
                <span className="meta fw-normal ms-2">({event.registered} signed up)</span>
              </p>
              {waitlisted && !closed && (
                <p className="waitlist-note">
                  You are on the waitlist. You will be notified if a slot opens.
                </p>
              )}

              {action}

              {notice && <div className={`alert alert-${notice.type} mt-2 mb-0`}>{notice.text}</div>}

              <button
                type="button"
                className="btn btn-outline-primary w-100 py-2 mt-2"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <FaCheck className="me-2" />
                    Link copied
                  </>
                ) : (
                  <>
                    <FaLink className="me-2" />
                    Copy link to share
                  </>
                )}
              </button>
            </>
          )}

          {tab === "volunteers" && canSeeList && <AttendancePanel event={event} />}

          {tab === "updates" && canSeeList && (
            <AnnouncementsPanel
              event={event}
              announcements={announcements}
              onChange={setAnnouncements}
            />
          )}
        </div>
      </div>
    </div>
  );
}