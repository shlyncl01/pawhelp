export const todayString = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

export const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// "9:00 AM – 12:00 PM", or just "9:00 AM" for old drives with no end time
export const formatTimeRange = (time, endTime) =>
  endTime ? `${formatTime(time)} – ${formatTime(endTime)}` : formatTime(time);

export const formatWhen = (date, time, endTime) => {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${day} · ${formatTimeRange(time, endTime)}`;
};

export const formatDay = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

export const formatJoined = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// Returns "cancelled", "ended", "today" or "upcoming".
// Pass the drive's status as the second argument to get "cancelled".
export const driveStatus = (date, status) => {
  if (status === "cancelled") return "cancelled";
  const today = todayString();
  if (date < today) return "ended";
  if (date === today) return "today";
  return "upcoming";
};

// Hours between two HH:MM times (0 if there is no end time)
export const driveHours = (time, endTime) => {
  if (!time || !endTime) return 0;
  const [h1, m1] = time.split(":").map(Number);
  const [h2, m2] = endTime.split(":").map(Number);
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  return minutes > 0 ? minutes / 60 : 0;
};

export const formatHours = (hours) =>
  `${Math.round(hours * 10) / 10} h`;

// "5 min ago", "3 h ago", "2 d ago", for notifications
export const timeAgo = (iso) => {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
};

// Link for the shareable drive page (Part 3 builds the page)
// Link for the shareable drive page. Uses the Vercel URL from VITE_CLIENT_URL,
// and falls back to the current address if it is not set.
export const driveLink = (id) => {
  const base = (import.meta.env.VITE_CLIENT_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/drives/${id}`;
};