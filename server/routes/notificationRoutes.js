import { Router } from "express";
import {
  getMyNotifications,
  markAllRead,
  markRead,
  clearAll,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getMyNotifications);
router.put("/read-all", markAllRead);
router.delete("/", clearAll);
router.put("/:id/read", markRead);

export default router;