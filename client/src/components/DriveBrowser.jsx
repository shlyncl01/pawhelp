import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchEvents,
  fetchMyRegistrations,
  joinEvent,
  cancelEvent,
  errorMessage,
} from "../api.js";
import { CATEGORIES } from "../constants.js";
import EventGrid from "./EventGrid.jsx";
import Pagination from "./Pagination.jsx";
import DriveModal from "./DriveModal.jsx";

export default function DriveBrowser({ title, onChange }) {
  const [events, setEvents] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [when, setWhen] = useState("upcoming");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadEvents = useCallback(
    async (silent) => {
      const current = ++requestId.current;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetchEvents({
          search: debouncedSearch,
          category,
          when,
          page,
          limit: 6,
        });
        if (current !== requestId.current) return;
        setEvents(res.data.events);
        setPages(res.data.pages);
        setTotal(res.data.total);
      } catch (err) {
        if (!silent && current === requestId.current) setError(errorMessage(err));
      } finally {
        if (!silent && current === requestId.current) setLoading(false);
      }
    },
    [debouncedSearch, category, when, page]
  );

  const loadJoined = useCallback(() => {
    fetchMyRegistrations()
      .then((res) => setJoinedIds(res.data.map((r) => r.event._id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEvents(false);
  }, [loadEvents]);

  useEffect(() => {
    loadJoined();
  }, [loadJoined]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      loadEvents(true);
      loadJoined();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadEvents, loadJoined]);

  const replaceEvent = (updated) =>
    setEvents((list) => list.map((e) => (e._id === updated._id ? updated : e)));

  const handleJoin = async (id) => {
    setError("");
    setSuccess("");
    setBusyId(id);
    try {
      const res = await joinEvent(id);
      replaceEvent(res.data);
      setJoinedIds((ids) => [...ids, id]);
      setSuccess("You joined the drive. Thank you for helping!");
      if (onChange) onChange();
    } catch (err) {
      setError(errorMessage(err));
      loadEvents(true);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id) => {
    setError("");
    setSuccess("");
    setBusyId(id);
    try {
      const res = await cancelEvent(id);
      replaceEvent(res.data);
      setJoinedIds((ids) => ids.filter((x) => x !== id));
      setSuccess("Your spot was cancelled.");
      if (onChange) onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const closeModal = useCallback(() => setSelectedId(null), []);
  const selected = events.find((e) => e._id === selectedId);

  return (
    <section>
      <h2 className="section-title mb-3">
        {title} <span className="count">({total})</span>
      </h2>

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-5">
          <input
            className="form-control"
            placeholder="Search drives by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-4">
          <select
            className="form-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
              setPage(1);
            }}
          >
            <option value="upcoming">Upcoming drives</option>
            <option value="past">Past drives</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p className="text-center py-5">Loading drives...</p>
      ) : (
        <>
          <EventGrid
            events={events}
            joinedIds={joinedIds}
            busyId={busyId}
            onJoin={handleJoin}
            onCancel={handleCancel}
            onDetails={setSelectedId}
          />
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {selected && (
        <DriveModal
          event={selected}
          joined={joinedIds.includes(selected._id)}
          busy={busyId === selected._id}
          onJoin={handleJoin}
          onCancel={handleCancel}
          onClose={closeModal}
        />
      )}
    </section>
  );
}