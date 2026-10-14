import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { addAnnouncement, deleteAnnouncement, errorMessage } from "../api.js";
import { formatJoined } from "../utils.js";

export default function AnnouncementsPanel({ event, announcements, onChange }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cancelled = event.status === "cancelled";

  const handlePost = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (message.length < 2) return setError("Write at least 2 characters");
    setError("");
    setSaving(true);
    try {
      const res = await addAnnouncement(event._id, message);
      onChange(res.data.announcements || []);
      setText("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this announcement?")) return;
    setError("");
    try {
      const res = await deleteAnnouncement(event._id, id);
      onChange(res.data.announcements || []);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <p className="meta">
        Volunteers who signed up get a notification, and the update shows on the public drive page.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {cancelled ? (
        <p className="meta">A cancelled drive cannot get new announcements.</p>
      ) : (
        <form onSubmit={handlePost} className="mb-3">
          <textarea
            className="form-control mb-2"
            rows="2"
            maxLength={500}
            placeholder='e.g. "Bring a leash" or "Moved to 8 AM"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="d-flex align-items-center">
            <span className="meta small">{text.length}/500</span>
            <button className="btn btn-primary ms-auto" disabled={saving}>
              {saving ? "Posting..." : "Post update"}
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="meta">No announcements yet.</p>
      ) : (
        [...announcements].reverse().map((a) => (
          <div className="announce-item d-flex gap-2" key={a._id}>
            <div className="flex-grow-1">
              <div>{a.message}</div>
              <div className="meta small">{formatJoined(a.createdAt)}</div>
            </div>
            <button
              className="btn btn-outline-danger btn-sm align-self-start"
              aria-label="Remove announcement"
              onClick={() => handleDelete(a._id)}
            >
              <FaRegTrashAlt />
            </button>
          </div>
        ))
      )}
    </>
  );
}