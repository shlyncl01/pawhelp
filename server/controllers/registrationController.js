import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { todayString } from "../utils/dates.js";
import { canManage } from "../utils/access.js";
import { notifyUsers } from "../utils/notify.js";
import { fillFromWaitlist } from "../utils/waitlist.js";

const ALREADY = "You are already signed up or on the waitlist for this drive";

export const registerForEvent = async (req, res) => {
  try {
    const today = todayString();

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $ne: "cancelled" },
        date: { $gte: today },
        $expr: { $lt: ["$registered", "$capacity"] },
      },
      { $inc: { registered: 1 } },
      { new: true },
    );

    if (event) {
      try {
        await Registration.create({
          event: event._id,
          user: req.user._id,
          status: "joined",
        });
      } catch (error) {
        await Event.findByIdAndUpdate(event._id, { $inc: { registered: -1 } });
        return res
          .status(400)
          .json({ message: error.code === 11000 ? ALREADY : error.message });
      }
      if (String(event.createdBy) !== String(req.user._id)) {
        await notifyUsers([event.createdBy], {
          event: event._id,
          type: "join",
          message: `${req.user.name} joined "${event.title}".`,
        });
      }
      return res
        .status(201)
        .json({ ...event.toObject(), myStatus: "joined" });
    }

    const found = await Event.findById(req.params.id).select(
      "date status title",
    );
    if (!found) return res.status(404).json({ message: "Drive not found" });
    if (found.status === "cancelled") {
      return res.status(409).json({ message: "This drive was cancelled" });
    }
    if (found.date < today) {
      return res.status(409).json({ message: "This drive has already ended" });
    }

    try {
      await Registration.create({
        event: found._id,
        user: req.user._id,
        status: "waitlist",
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: error.code === 11000 ? ALREADY : error.message });
    }

    await fillFromWaitlist(found._id);
    const updated = await Event.findById(found._id);
    const mine = await Registration.findOne({
      event: found._id,
      user: req.user._id,
    });
    res
      .status(201)
      .json({ ...updated.toObject(), myStatus: mine?.status || "waitlist" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const reg = await Registration.findOneAndDelete({
      event: req.params.id,
      user: req.user._id,
    });
    if (!reg) {
      return res
        .status(404)
        .json({ message: "You have not joined this drive" });
    }

    const wasJoined = reg.status !== "waitlist";
    if (wasJoined) {
      await Event.findByIdAndUpdate(req.params.id, {
        $inc: { registered: -1 },
      });
      await fillFromWaitlist(req.params.id);
    }

    const event = await Event.findById(req.params.id);
    if (event && wasJoined && String(event.createdBy) !== String(req.user._id)) {
      await notifyUsers([event.createdBy], {
        event: event._id,
        type: "cancel",
        message: `${req.user.name} cancelled their spot in "${event.title}".`,
      });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const list = await Registration.find({ user: req.user._id })
      .populate("event", "-image -announcements")
      .sort({ createdAt: -1 });
    res.json(list.filter((r) => r.event));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "Only the organizer can see volunteers" });
    }
    const list = await Registration.find({ event: event._id })
      .populate("user", "name email")
      .sort({ createdAt: 1 });
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const setAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!canManage(event, req.user)) {
      return res
        .status(403)
        .json({ message: "Only the organizer can mark attendance" });
    }
    const attended =
      req.body.attended === true || req.body.attended === "true";
    const reg = await Registration.findOneAndUpdate(
      {
        _id: req.params.regId,
        event: event._id,
        status: { $ne: "waitlist" },
      },
      { attended },
      { new: true },
    ).populate("user", "name email");
    if (!reg) return res.status(404).json({ message: "Volunteer not found" });
    res.json(reg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};