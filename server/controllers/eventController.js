import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { todayString } from "../utils/dates.js";

const isOwner = (event, user) =>
  event.createdBy.toString() === user._id.toString() || user.role === "admin";

export const getEvents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 6, 24);
    const filter = {};
    const { category, when } = req.query;
    if (category && category !== "All") filter.category = category;
    const search = (req.query.search || "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();
    if (search) filter.title = { $regex: search, $options: "i" };
    const today = todayString();
    if (when === "past") filter.date = { $lt: today };
    else if (when !== "all") filter.date = { $gte: today };
    const sort =
      when === "past" ? { date: -1, time: -1 } : { date: 1, time: 1 };
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
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
    const events = await Event.find({ createdBy: req.user._id }).sort({
      date: 1,
      time: 1,
    });
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
      location,
      category,
      capacity,
      whatToBring,
      experience,
      image,
    } = req.body;
    const event = await Event.create({
      title,
      organization,
      description,
      date,
      time,
      location,
      category,
      capacity,
      whatToBring,
      experience: experience || "None",
      image,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!isOwner(event, req.user)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own drives" });
    }
    const {
      title,
      organization,
      description,
      date,
      time,
      location,
      category,
      capacity,
      whatToBring,
      experience,
      image,
    } = req.body;
    if (capacity < event.registered) {
      return res.status(400).json({
        message: `Volunteers needed cannot be lower than the ${event.registered} volunteers already signed up`,
      });
    }
    Object.assign(event, {
      title,
      organization,
      description: description ?? "",
      date,
      time,
      location,
      category,
      capacity,
      whatToBring: whatToBring ?? "",
      experience: experience || "None",
      image,
    });
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Drive not found" });
    if (!isOwner(event, req.user)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own drives" });
    }
    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: "Drive deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};