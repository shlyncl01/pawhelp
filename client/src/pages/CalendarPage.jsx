import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaRegCalendarAlt } from "react-icons/fa";
import {
  fetchEvents,
  fetchEvent,
  fetchMyRegistrations,
  joinEvent,
  cancelEvent,
  errorMessage,
} from "../api.js";
import { CATEGORIES } from "../constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { todayString, monthKey, MONTH_NAMES, formatDay } from "../utils.js";
import Calendar, { CalendarList } from "../components/Calendar.jsx";
import DriveModal from "../components/DriveModal.jsx";

export default function CalendarPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(() => Number(todayString().slice(0, 4)));
  const [month, setMonth] = useState(() => Number(todayString().slice(5, 7)) - 1);
  const [events, setEvents] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [category, setCategory] = useState("All");
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestId = useRef(0);

  const key = monthKey(year, month);

  const loadEvents = useCallback(
    async (silent) => {
      const current = ++requestId.current;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetchEvents({ month: key, category });
        if (current !== requestId.current) return;
        setEvents(res.data.events);
      } catch (err) {
        if (!silent && current === requestId.current) setError(errorMessage(err));
      } finally {
        if (!silent && current === requestId.current) setLoading(false);
      }
    },
    [key, category]
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

  const goTo = (y, m) => {
    let newYear = y;
    let newMonth = m;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    setSelectedDay(null);
  };

  const goToday = () => {
    const t = todayString();
    goTo(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1);
  };

  const openEvent = async (id) => {
    setError("");
    try {
      const res = await fetchEvent(id);
      setSelected(res.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const applyUpdate = (updated) => {
    setSelected(updated);
    setEvents((list) =>
      list.map((e) =>
        e._id === updated._id
          ? { ...e, registered: updated.registered, capacity: updated.capacity }
          : e
      )
    );
  };

  const handleJoin = async (id) => {
    setError("");
    setSuccess("");
    setBusyId(id);
    try {
      const res = await joinEvent(id);
      applyUpdate(res.data);
      setJoinedIds((ids) => [...ids, id]);
      setSuccess("You joined the drive. Thank you for helping!");
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
      applyUpdate(res.data);
      setJoinedIds((ids) => ids.filter((x) => x !== id));
      setSuccess("Your spot was cancelled.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const closeModal = useCallback(() => setSelected(null), []);

  const visible = mineOnly
    ? events.filter(
        (e) =>
          String(e.createdBy) === String(user._id) || joinedIds.includes(e._id)
      )
    : events;

  const dayEvents = selectedDay ? visible.filter((e) => e.date === selectedDay) : [];

  const listItem = selected && events.find((e) => e._id === selected._id);
  const modalEvent = selected && { ...selected, ...(listItem || {}) };

  const years = Array.from({ length: 5 }, (_, i) => year - 2 + i);

  return (
    <>
      <h2 className="section-title mb-3">
        Drive Calendar{" "}
        <span className="count">
          ({visible.length} {visible.length === 1 ? "drive" : "drives"} this month)
        </span>
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="paw-card p-3 p-md-4">
        <div className="cal-toolbar mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-outline-primary"
              onClick={() => goTo(year, month - 1)}
              aria-label="Previous month"
            >
              <FaChevronLeft />
            </button>
            <button className="btn btn-outline-primary" onClick={goToday}>
              Today
            </button>
            <select
              className="form-select cal-select"
              value={year}
              onChange={(e) => goTo(Number(e.target.value), month)}
              aria-label="Year"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="form-select cal-select"
              value={month}
              onChange={(e) => goTo(year, Number(e.target.value))}
              aria-label="Month"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
            <button
              className="btn btn-outline-primary"
              onClick={() => goTo(year, month + 1)}
              aria-label="Next month"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select cal-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="mineOnly"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
              />
              <label className="form-check-label fw-bold" htmlFor="mineOnly">
                My drives only
              </label>
            </div>
          </div>
        </div>

        <div className="cal-title mb-3">
          <FaRegCalendarAlt className="me-2" />
          {MONTH_NAMES[month]} {year}
        </div>

        <div className="cal-legend mb-3">
          <span><i className="dot dot-upcoming" /> Upcoming</span>
          <span><i className="dot dot-joined" /> Joined</span>
          <span><i className="dot dot-mine" /> You organize</span>
          <span><i className="dot dot-ended" /> Ended</span>
        </div>

        <div className={loading ? "cal-loading" : ""}>
          <div className="d-none d-md-block">
            <Calendar
              year={year}
              month={month}
              events={visible}
              joinedIds={joinedIds}
              userId={user._id}
              selectedDay={selectedDay}
              onSelectEvent={openEvent}
              onSelectDay={setSelectedDay}
            />
          </div>

          <div className="d-md-none">
            <CalendarList
              events={visible}
              joinedIds={joinedIds}
              userId={user._id}
              onSelectEvent={openEvent}
              grouped
            />
          </div>
        </div>

        {selectedDay && (
          <div className="cal-day-panel mt-4 d-none d-md-block">
            <div className="d-flex align-items-center mb-2">
              <h5 className="fw-bold mb-0">{formatDay(selectedDay)}</h5>
              <button
                className="btn btn-outline-primary btn-sm ms-auto"
                onClick={() => setSelectedDay(null)}
              >
                Close
              </button>
            </div>
            <CalendarList
              events={dayEvents}
              joinedIds={joinedIds}
              userId={user._id}
              onSelectEvent={openEvent}
            />
          </div>
        )}
      </div>

      {modalEvent && (
        <DriveModal
          event={modalEvent}
          joined={joinedIds.includes(modalEvent._id)}
          busy={busyId === modalEvent._id}
          onJoin={handleJoin}
          onCancel={handleCancel}
          onClose={closeModal}
        />
      )}
    </>
  );
}