import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchEvent,
  fetchMyRegistrations,
  joinEvent,
  cancelEvent,
  errorMessage,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { confirmNoClash } from "../joinCheck.js";
import DriveModal from "../components/DriveModal.jsx";

export default function DrivePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const userId = user?._id;
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (silent) => {
      try {
        const res = await fetchEvent(id);
        setEvent(res.data);
        setError("");
      } catch (err) {
        if (!silent) {
          const code = err.response?.status;
          setError(
            code === 404 || code === 400
              ? "This drive could not be found. It may have been deleted."
              : errorMessage(err)
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
      if (userId) {
        try {
          const regs = await fetchMyRegistrations();
          const mine = regs.data.find((r) => r.event._id === id);
          setMyStatus(mine ? (mine.status === "waitlist" ? "waitlist" : "joined") : null);
        } catch {
          /* keep the last known status */
        }
      } else {
        setMyStatus(null);
      }
    },
    [id, userId]
  );

  useEffect(() => {
    load(false);
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const handleJoin = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (!(await confirmNoClash(event))) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await joinEvent(id);
      const { myStatus: result, ...updated } = res.data;
      setEvent(updated);
      setMyStatus(result === "waitlist" ? "waitlist" : "joined");
      setNotice({
        type: "success",
        text:
          result === "waitlist"
            ? "This drive is full, so you were added to the waitlist. We will notify you if a slot opens."
            : "You joined the drive. Thank you for helping!",
      });
    } catch (err) {
      setNotice({ type: "danger", text: errorMessage(err) });
      load(true);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await cancelEvent(id);
      setMyStatus(null);
      setNotice({ type: "success", text: "Your spot was cancelled." });
      await load(true);
    } catch (err) {
      setNotice({ type: "danger", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = useCallback(() => navigate("/drives"), [navigate]);

  if (loading) return <p className="text-center py-5">Loading drive...</p>;

  if (error || !event) {
    return (
      <div className="paw-card p-4 text-center">
        <h4 className="fw-bold">Drive not found</h4>
        <p className="meta">{error}</p>
        <Link className="btn btn-primary" to="/drives">
          Browse all drives
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="paw-card p-4 text-center">
        <h4 className="fw-bold mb-1">{event.title}</h4>
        <p className="meta">Shared from PawHelp</p>
        <Link className="btn btn-primary" to="/drives">
          Browse all drives
        </Link>
      </div>

      <DriveModal
        event={event}
        joined={myStatus === "joined"}
        waitlisted={myStatus === "waitlist"}
        busy={busy}
        notice={notice}
        onJoin={handleJoin}
        onCancel={handleCancel}
        onClose={handleClose}
      />
    </>
  );
}