import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { notifyUsers } from "./notify.js";
import { todayString } from "./dates.js";

export const fillFromWaitlist = async (eventId) => {
  for (;;) {
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: { $ne: "cancelled" },
        date: { $gte: todayString() },
        $expr: { $lt: ["$registered", "$capacity"] },
      },
      { $inc: { registered: 1 } },
      { new: true },
    );
    if (!event) return;

    const next = await Registration.findOneAndUpdate(
      { event: eventId, status: "waitlist" },
      { status: "joined" },
      { sort: { createdAt: 1 }, new: true },
    );
    if (!next) {
      await Event.findByIdAndUpdate(eventId, { $inc: { registered: -1 } });
      return;
    }

    await notifyUsers([next.user], {
      event: event._id,
      type: "promoted",
      message: `A slot opened up. You are now signed up for "${event.title}".`,
    });
  }
};