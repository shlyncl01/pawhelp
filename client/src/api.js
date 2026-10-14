import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthForm = url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

// Auth
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const fetchMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);

// Drives
export const fetchEvents = (params) => api.get("/events", { params });
export const fetchMyEvents = () => api.get("/events/mine");
export const fetchEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post("/events", data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const cancelDrive = (id, reason = "") =>
  api.put(`/events/${id}/cancel`, { reason });

// Announcements
export const addAnnouncement = (id, message) =>
  api.post(`/events/${id}/announcements`, { message });
export const deleteAnnouncement = (id, announcementId) =>
  api.delete(`/events/${id}/announcements/${announcementId}`);

// Registrations (joinEvent may now return myStatus: "joined" or "waitlist")
export const joinEvent = (id) => api.post(`/events/${id}/registrations`);
export const cancelEvent = (id) => api.delete(`/events/${id}/registrations`);
export const fetchEventRegistrations = (id) =>
  api.get(`/events/${id}/registrations`);
export const fetchMyRegistrations = () => api.get("/registrations/mine");
export const setAttendance = (id, regId, attended) =>
  api.put(`/events/${id}/registrations/${regId}/attendance`, { attended });

// Notifications
export const fetchNotifications = () => api.get("/notifications");
export const markAllNotificationsRead = () => api.put("/notifications/read-all");
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const clearNotifications = () => api.delete("/notifications");

// Admin
export const fetchAdminStats = () => api.get("/admin/stats");
export const fetchAdminUsers = () => api.get("/admin/users");
export const updateUserRole = (id, role) =>
  api.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const fetchAdminEvents = () => api.get("/admin/events");

export default api;