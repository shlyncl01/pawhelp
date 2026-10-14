import { randomUUID } from "crypto";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { todayString, addDays } from "../utils/dates.js";
import { canManage } from "../utils/access.js";
import { notifyUsers } from "../utils/notify.js";
import { fillFromWaitlist } from "../utils/waitlist.js";

const registrantIds = async (eventId) => {
  const list = await Registration.find({ event: eventId }).select("user");
  return list.map((r) => r.user);
};

export const getEvents = async (req, res) => {
  try {
    const { category, when, month } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    const search = (req.query.search || "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();
    if (search) filter.title = { $regex: search, $options: "i" };

    if (month !== undefined) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ message: "Month must be YYYY-MM" });
      }
      filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
      const monthEvents = await Event.find(filter)
        .select("-image -announcements")
        .sort({ date: 1, time: 1 })
        .limit(300);
      return res.json({ events: monthEvents, total: monthEvents.length });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 6, 24);
    const today = todayString();
    if (when === "past") filter.date = { $lt: today };
    else if (when !== "all") filter.date = { $gte: today };
    const sort =
      when === "past" ? { date: -1, time: -1 } : { date: 1, time: 1 };
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .select("-announcements")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ events, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .select("-announcements")
      .sort({ date: 1, time: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      organization,
      description,
      date,
      time,
      endTime,
      location,
      category,
      capacity,
      whatToBring,
      experience,
      image,
    } = req.body;

    const repeatCount = Math.min(
      Math.max(parseInt(req.body.repeatCount) || 1, 1),
      12,
    );
    const seriesId = repeatCount > 1 ? randomUUID() : "";

    const docs = Array.from({ length: repeatCount }, (_, i) => ({
      title,
      organization,
      description,
      date: addDays(date, i * 7),
      time,
      endTime,
      location,
      category,
      capacity,
      whatToBring,
      experience: experience || "None",
      image,
      seriesId,
      createdBy: req.user._id,
    }));

    const events = await Event.insertMany(docs);
    res
      .status(201)
      .json({ ...events[0].toObject(), seriesCount: events.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own drives" });
    }
    if (event.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "A cancelled drive cannot be edited" });
    }

    const {
      title,
      organization,
      description,
      date,
      time,
      endTime,
      location,
      category,
      capacity,
      whatToBring,
      experience,
      image,
    } = req.body;

    if (Number(capacity) < event.registered) {
      return res.status(400).json({
        message: `Volunteers needed cannot be lower than the ${event.registered} volunteers already signed up`,
      });
    }
    if (date !== event.date && date < todayString()) {
      return res.status(400).json({ message: "Date cannot be in the past" });
    }

    const changes = [];
    if (date !== event.date) changes.push("date");
    if (time !== event.time) changes.push("start time");
    if ((endTime || "") !== (event.endTime || "")) changes.push("end time");
    if (location !== event.location) changes.push("location");

    Object.assign(event, {
      title,
      organization,
      description: description ?? "",
      date,
      time,
      endTime: endTime ?? "",
      location,
      category,
      capacity: Number(capacity),
      whatToBring: whatToBring ?? "",
      experience: experience || "None",
      image,
    });
    await event.save();

    if (changes.length > 0) {
      await notifyUsers(await registrantIds(event._id), {
        event: event._id,
        type: "update",
        message: `"${event.title}" was updated: ${changes.join(", ")} changed.`,
      });
    }

    await fillFromWaitlist(event._id);
    const fresh = await Event.findById(event._id);
    res.json(fresh);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own drives" });
    }
    if (event.status === "cancelled") {
      return res.status(400).json({ message: "This drive is already cancelled" });
    }

    const reason = (req.body?.reason || "").trim().slice(0, 300);
    event.status = "cancelled";
    event.cancelReason = reason;
    await event.save();

    await notifyUsers(await registrantIds(event._id), {
      event: event._id,
      type: "cancelled",
      message: `"${event.title}" on ${event.date} was cancelled.${
        reason ? ` Reason: ${reason}` : ""
      }`,
    });

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own drives" });
    }

    await notifyUsers(await registrantIds(event._id), {
      type: "deleted",
      message: `"${event.title}" on ${event.date} was deleted by the organizer.`,
    });

    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: "Drive deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addAnnouncement = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "Only the organizer can post announcements" });
    }
    if (event.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "A cancelled drive cannot get new announcements" });
    }

    const message = req.body.message.trim();
    event.announcements.push({ message });
    await event.save();

    const short = message.length > 120 ? `${message.slice(0, 117)}...` : message;
    await notifyUsers(await registrantIds(event._id), {
      event: event._id,
      type: "announcement",
      message: `New update for "${event.title}": ${short}`,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "Only the organizer can remove announcements" });
    }
    event.announcements.pull({ _id: req.params.announcementId });
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};