import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { todayString } from "../utils/dates.js";

export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        date: { $gte: todayString() },
        $expr: { $lt: ["$registered", "$capacity"] },
      },
      { $inc: { registered: 1 } },
      { new: true },
    );
    if (!event) {
      const found = await Event.findById(req.params.id).select("date");
      if (!found) return res.status(404).json({ message: "Drive not found" });
      return found.date < todayString()
        ? res.status(409).json({ message: "This drive has already ended" })
        : res.status(409).json({ message: "This drive is full" });
    }
    try {
      await Registration.create({ event: event._id, user: req.user._id });
      res.status(201).json(event);
    } catch (error) {
      await Event.findByIdAndUpdate(event._id, { $inc: { registered: -1 } });
      const message =
        error.code === 11000
          ? "You already joined this drive"
          : error.message;
      res.status(400).json({ message });
    }
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
    if (!reg)
      return res
        .status(404)
        .json({ message: "You have not joined this drive" });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { registered: -1 } },
      { new: true },
    );
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const list = await Registration.find({ user: req.user._id })
      .populate("event")
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
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only the organizer can see volunteers" });
    }
    const list = await Registration.find({ event: event._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};