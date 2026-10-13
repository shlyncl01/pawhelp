import Notification from "../models/Notification.js";

export const notifyUsers = async (userIds, { event = null, type, message }) => {
  const unique = [...new Set(userIds.map(String))];
  if (unique.length === 0) return;
  try {
    await Notification.insertMany(
      unique.map((user) => ({ user, event, type, message })),
    );
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};