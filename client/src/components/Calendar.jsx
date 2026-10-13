import { FaMapMarkerAlt } from "react-icons/fa";
import { driveStatus, todayString, formatTime, monthKey } from "../utils.js";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MAX_CHIPS = 2;

const statusOf = (event, joinedIds, userId) => {
  if (driveStatus(event.date) === "ended") return "ended";
  if (String(event.createdBy) === String(userId)) return "mine";
  if (joinedIds.includes(event._id)) return "joined";
  return "upcoming";
};

export default function Calendar({
  year,
  month,
  events,
  joinedIds,
  userId,
  selectedDay,
  onSelectEvent,
  onSelectDay,
}) {
  const today = todayString();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  events.forEach((e) => {
    (byDay[e.date] ||= []).push(e);
  });

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="cal-wrap">
      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
      </div>
      <div className="cal-body">
        {cells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="cal-cell empty" />;
          const dateStr = `${monthKey(year, month)}-${String(day).padStart(2, "0")}`;
          const dayEvents = byDay[dateStr] || [];
          const extra = dayEvents.length - MAX_CHIPS;
          const classes = [
            "cal-cell",
            dateStr === today ? "today" : "",
            dateStr === selectedDay ? "selected" : "",
            dayEvents.length > 0 ? "has-events" : "",
          ].join(" ");

          return (
            <div
              key={dateStr}
              className={classes}
              onClick={() => dayEvents.length > 0 && onSelectDay(dateStr)}
            >
              <div className="cal-day-number">{day}</div>
              {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                <button
                  key={e._id}
                  type="button"
                  className={`cal-chip chip-${statusOf(e, joinedIds, userId)}`}
                  title={`${formatTime(e.time)} ${e.title}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onSelectEvent(e._id);
                  }}
                >
                  {formatTime(e.time)} {e.title}
                </button>
              ))}
              {extra > 0 && <div className="cal-more">+{extra} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarList({ events, joinedIds, userId, onSelectEvent, grouped }) {
  if (events.length === 0) {
    return <p className="meta mb-0">No drives to show.</p>;
  }

  const groups = {};
  events.forEach((e) => {
    (groups[e.date] ||= []).push(e);
  });

  const tagText = (e, status) => {
    if (status === "ended") return "Ended";
    if (status === "mine") return "You organize";
    if (status === "joined") return "Joined";
    const left = e.capacity - e.registered;
    return left <= 0 ? "Full" : `${left} slots left`;
  };

  return (
    <div>
      {Object.keys(groups)
        .sort()
        .map((date) => (
          <div key={date} className="mb-3">
            {grouped && <div className="detail-label mb-2">{formatDayLabel(date)}</div>}
            {groups[date].map((e) => {
              const status = statusOf(e, joinedIds, userId);
              return (
                <button
                  key={e._id}
                  type="button"
                  className={`cal-item item-${status}`}
                  onClick={() => onSelectEvent(e._id)}
                >
                  <div className="cal-item-time">{formatTime(e.time)}</div>
                  <div className="flex-grow-1 text-start">
                    <div className="fw-bold">{e.title}</div>
                    <div className="meta small">
                      <FaMapMarkerAlt className="me-1" />
                      {e.location}
                    </div>
                  </div>
                  <span className={`cal-tag tag-${status}`}>{tagText(e, status)}</span>
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}

const formatDayLabel = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};