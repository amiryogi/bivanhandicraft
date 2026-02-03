/**
 * Notification Routes
 * Routes for push notification testing and admin operations
 */
import { Router } from "express";
import { sendTestNotification, broadcastNotification, sendStockAlert } from "../controllers/notificationController";
import { protect } from "../middleware/auth";
import { adminOnly } from "../middleware/role";

const router = Router();

// Protected routes (require authentication)
router.use(protect);

// Test notification - any authenticated user can test
router.post("/test", sendTestNotification);

// Admin only routes
router.post("/broadcast", adminOnly, broadcastNotification);
router.post("/stock-alert", adminOnly, sendStockAlert);

export default router;
