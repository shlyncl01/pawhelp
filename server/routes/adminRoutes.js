import { Router } from "express";
import { body } from "express-validator";
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllEvents,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const roleRules = [
  body("role")
    .isIn(["user", "admin"])
    .withMessage("Role must be user or admin"),
];

router.use(protect, adminOnly);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/role", roleRules, validate, updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/events", getAllEvents);

export default router;