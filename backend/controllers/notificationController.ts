/**
 * Notification Controller
 * Handles push notification testing and admin operations
 */
import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { sendPushNotification, sendPromotionalNotification, sendBackInStockNotification } from "../services/pushNotificationService";
import User from "../models/User";

/**
 * @desc    Send test notification to current user (for debugging)
 * @route   POST /api/v1/notifications/test
 * @access  Private
 */
const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: "error", message: "Not authenticated" });
    return;
  }

  const userId = (req.user as any)._id.toString();
  
  const tickets = await sendPushNotification(
    userId,
    "🔔 Test Notification",
    "Push notifications are working! This is a test from BivanHandicraft.",
    { type: "general", test: true }
  );

  if (tickets.length === 0) {
    res.status(404).json({
      status: "error",
      message: "No push tokens found for your account. Make sure you're logged in on the mobile app.",
    });
    return;
  }

  const successCount = tickets.filter(t => t.status === "ok").length;
  const errorCount = tickets.filter(t => t.status === "error").length;

  res.status(200).json({
    status: "success",
    message: `Test notification sent! Success: ${successCount}, Errors: ${errorCount}`,
    data: {
      tickets,
      totalTokens: tickets.length,
      successCount,
      errorCount,
    },
  });
});

/**
 * @desc    Send broadcast notification to all users (admin only)
 * @route   POST /api/v1/notifications/broadcast
 * @access  Private/Admin
 */
const broadcastNotification = asyncHandler(async (req: Request, res: Response) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    res.status(400).json({
      status: "error",
      message: "Title and body are required",
    });
    return;
  }

  const tickets = await sendPromotionalNotification(title, body, data);

  res.status(200).json({
    status: "success",
    message: `Broadcast sent to ${tickets.length} devices`,
    data: {
      totalSent: tickets.length,
      successCount: tickets.filter(t => t.status === "ok").length,
      errorCount: tickets.filter(t => t.status === "error").length,
    },
  });
});

/**
 * @desc    Send back-in-stock notification to all users (admin only)
 * @route   POST /api/v1/notifications/stock-alert
 * @access  Private/Admin
 */
const sendStockAlert = asyncHandler(async (req: Request, res: Response) => {
  const { productName, productSlug } = req.body;

  if (!productName || !productSlug) {
    res.status(400).json({
      status: "error",
      message: "productName and productSlug are required",
    });
    return;
  }

  // Get all users with push tokens
  const usersWithTokens = await User.find({
    "pushTokens.0": { $exists: true },
    isActive: true,
  }).select("_id");

  if (usersWithTokens.length === 0) {
    res.status(200).json({
      status: "success",
      message: "No users with push tokens found",
      data: { totalSent: 0 },
    });
    return;
  }

  // Send to all users in parallel
  const results = await Promise.allSettled(
    usersWithTokens.map((user) =>
      sendBackInStockNotification(user._id.toString(), productName, productSlug)
    )
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;

  res.status(200).json({
    status: "success",
    message: `Stock alert sent to ${successCount} users`,
    data: {
      totalUsers: usersWithTokens.length,
      successCount,
      errorCount,
    },
  });
});

export { sendTestNotification, broadcastNotification, sendStockAlert };

