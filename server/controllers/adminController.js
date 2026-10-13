import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Notification from "../models/Notification.js";
import { todayString } from "../utils/dates.js";
import { notifyUsers } from "../utils/notify.js";
import { fillFromWaitlist } from "../utils/waitlist.js";

export const getStats = async (req, res) => {
  try {
    const [users, events, upcoming, registrations, cancelled] =
      await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Event.countDocuments({
          date: { $gte: todayString() },
          status: { $ne: "cancelled" },
        }),
        Registration.countDocuments({ status: { $ne: "waitlist" } }),
        Event.countDocuments({ status: "cancelled" }),
      ]);
    res.json({ users, events, upcoming, registrations, cancelled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const [organized, joined] = await Promise.all([
      Event.aggregate([{ $group: { _id: "$createdBy", count: { $sum: 1 } } }]),
      Registration.aggregate([
        { $match: { status: { $ne: "waitlist" } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
    ]);
    const organizedMap = new Map(organized.map((o) => [String(o._id), o.count]));
    const joinedMap = new Map(joined.map((j) => [String(j._id), j.count]));
    res.json(
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        organized: organizedMap.get(String(u._id)) || 0,
        joined: joinedMap.get(String(u._id)) || 0,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account here" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const owned = await Event.find({ createdBy: id }).select("title date");
    for (const ev of owned) {
      const regs = await Registration.find({ event: ev._id }).select("user");
      await notifyUsers(
        regs.map((r) => r.user),
        {
          type: "deleted",
          message: `"${ev.title}" on ${ev.date} was removed by an administrator.`,
        },
      );
    }
    await Registration.deleteMany({ event: { $in: owned.map((e) => e._id) } });
    await Event.deleteMany({ createdBy: id });

    const mine = await Registration.find({ user: id });
    await Registration.deleteMany({ user: id });
    const affected = new Set();
    for (const r of mine) {
      if (r.status !== "waitlist") {
        await Event.findByIdAndUpdate(r.event, { $inc: { registered: -1 } });
        affected.add(String(r.event));
      }
    }
    for (const eventId of affected) await fillFromWaitlist(eventId);

    await Notification.deleteMany({ user: id });
    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .select("-image -announcements")
      .populate("createdBy", "name email")
      .sort({ date: -1, time: -1 })
      .limit(500);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};