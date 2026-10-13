import { Router } from "express";
import { body } from "express-validator";
import {
  getEvents,
  getMyEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  addAnnouncement,
  deleteAnnouncement,
} from "../controllers/eventController.js";
import {
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  setAttendance,
} from "../controllers/registrationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { todayString } from "../utils/dates.js";

const router = Router();

const baseRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("organization")
    .trim()
    .notEmpty()
    .withMessage("Organization is required"),
  body("date")
    .matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .withMessage("Date must be YYYY-MM-DD"),
  body("time")
    .matches(/^[0-9]{2}:[0-9]{2}$/)
    .withMessage("Time must be HH:MM"),
  body("endTime")
    .matches(/^[0-9]{2}:[0-9]{2}$/)
    .withMessage("End time must be HH:MM")
    .custom((value, { req }) => {
      if (!(value > req.body.time)) {
        throw new Error("End time must be after the start time");
      }
      return true;
    }),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Volunteers needed must be at least 1"),
  body("experience")
    .optional({ values: "falsy" })
    .isIn(["None", "Beginner", "Experienced"])
    .withMessage("Experience must be None, Beginner or Experienced"),
  body("image").notEmpty().withMessage("Image is required"),
];

const createRules = [
  ...baseRules,
  body("date").custom((value) => {
    if (value < todayString()) throw new Error("Date cannot be in the past");
    return true;
  }),
  body("repeatCount")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 12 })
    .withMessage("Repeat must be between 1 and 12 weeks"),
];

const cancelRules = [
  body("reason")
    .optional({ values: "falsy" })
    .isLength({ max: 300 })
    .withMessage("Reason must be 300 characters or less"),
];

const announcementRules = [
  body("message")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Announcement must be 2 to 500 characters"),
];

const attendanceRules = [
  body("attended").isBoolean().withMessage("attended must be true or false"),
];

router.get("/mine", protect, getMyEvents);
router
  .route("/")
  .get(getEvents)
  .post(protect, createRules, validate, createEvent);
router
  .route("/:id")
  .get(getEvent)
  .put(protect, baseRules, validate, updateEvent)
  .delete(protect, deleteEvent);
router.put("/:id/cancel", protect, cancelRules, validate, cancelEvent);
router.post(
  "/:id/announcements",
  protect,
  announcementRules,
  validate,
  addAnnouncement,
);
router.delete("/:id/announcements/:announcementId", protect, deleteAnnouncement);
router
  .route("/:id/registrations")
  .get(protect, getEventRegistrations)
  .post(protect, registerForEvent)
  .delete(protect, cancelRegistration);
router.put(
  "/:id/registrations/:regId/attendance",
  protect,
  attendanceRules,
  validate,
  setAttendance,
);

export default router;