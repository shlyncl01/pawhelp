export const canManage = (event, user) =>
  event.createdBy.toString() === user._id.toString() || user.role === "admin";