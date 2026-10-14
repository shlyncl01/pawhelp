import { fetchMyRegistrations } from "./api.js";
import { formatTimeRange } from "./utils.js";

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Old drives without an end time are treated as one hour long
const range = (e) => {
  const start = toMinutes(e.time);
  const end = e.endTime ? toMinutes(e.endTime) : start + 60;
  return [start, end];
};

// Returns true if it is fine to join, or if the volunteer chose to join anyway
export const confirmNoClash = async (event) => {
  try {
    const res = await fetchMyRegistrations();
    const [start, end] = range(event);
    const clash = res.data.find((r) => {
      const other = r.event;
      if (!other || other._id === event._id) return false;
      if (r.status === "waitlist" || other.status === "cancelled") return false;
      if (other.date !== event.date) return false;
      const [otherStart, otherEnd] = range(other);
      return start < otherEnd && otherStart < end;
    });
    if (!clash) return true;
    return window.confirm(
      `You already signed up for "${clash.event.title}" (${formatTimeRange(
        clash.event.time,
        clash.event.endTime
      )}) at the same time.\n\nJoin "${event.title}" anyway?`
    );
  } catch {
    return true;
  }
};