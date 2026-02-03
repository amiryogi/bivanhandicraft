/**
 * Push Notification Service
 * Sends push notifications to users via Expo Push Notification Service
 */
import { getUserPushTokens } from "./authService";

interface ExpoPushMessage {
  to: string;
  sound?: "default" | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  badge?: number;
}

interface ExpoPushTicket {
  id?: string;
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  options?: {
    channelId?: string;
    sound?: "default" | null;
    badge?: number;
  },
): Promise<ExpoPushTicket[]> {
  const tokens = await getUserPushTokens(userId);

  if (tokens.length === 0) {
    console.log(`No push tokens found for user ${userId}`);
    return [];
  }

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    sound: options?.sound ?? "default",
    title,
    body,
    data,
    channelId: options?.channelId,
    priority: "high",
    badge: options?.badge,
  }));

  return sendPushMessages(messages);
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToMany(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
  options?: {
    channelId?: string;
    sound?: "default" | null;
  },
): Promise<ExpoPushTicket[]> {
  const allTokens: string[] = [];

  for (const userId of userIds) {
    const tokens = await getUserPushTokens(userId);
    allTokens.push(...tokens.map((t) => t.token));
  }

  if (allTokens.length === 0) {
    console.log("No push tokens found for any users");
    return [];
  }

  const messages: ExpoPushMessage[] = allTokens.map((token) => ({
    to: token,
    sound: options?.sound ?? "default",
    title,
    body,
    data,
    channelId: options?.channelId,
    priority: "high",
  }));

  return sendPushMessages(messages);
}

/**
 * Send order status update notification
 */
export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: string,
  orderNumber?: string,
): Promise<ExpoPushTicket[]> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    processing: {
      title: "Order Confirmed! 🎉",
      body: `Your order ${orderNumber || orderId} is being processed.`,
    },
    shipped: {
      title: "Order Shipped! 📦",
      body: `Your order ${orderNumber || orderId} is on its way!`,
    },
    delivered: {
      title: "Order Delivered! ✅",
      body: `Your order ${orderNumber || orderId} has been delivered.`,
    },
    cancelled: {
      title: "Order Cancelled",
      body: `Your order ${orderNumber || orderId} has been cancelled.`,
    },
  };

  const message = statusMessages[status] || {
    title: "Order Update",
    body: `Your order ${orderNumber || orderId} status: ${status}`,
  };

  return sendPushNotification(
    userId,
    message.title,
    message.body,
    {
      type: "order_update",
      orderId,
      status,
    },
    {
      channelId: "orders",
    },
  );
}

/**
 * Send promotional notification to all users with tokens
 */
export async function sendPromotionalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<ExpoPushTicket[]> {
  // In production, you'd want to batch this and handle pagination
  // For now, this is a simplified version
  const User = (await import("../models/User")).default;
  const usersWithTokens = await User.find({
    "pushTokens.0": { $exists: true },
    isActive: true,
  }).select("pushTokens");

  const allTokens: string[] = [];
  usersWithTokens.forEach((user) => {
    user.pushTokens.forEach((pt) => {
      allTokens.push(pt.token);
    });
  });

  if (allTokens.length === 0) {
    return [];
  }

  const messages: ExpoPushMessage[] = allTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: { ...data, type: "promotion" },
    channelId: "promotions",
    priority: "default",
  }));

  return sendPushMessages(messages);
}

/**
 * Send order placed confirmation to customer
 */
export async function sendOrderPlacedNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  total: number,
): Promise<ExpoPushTicket[]> {
  return sendPushNotification(
    userId,
    "Order Placed Successfully! 🛒",
    `Your order #${orderNumber} for NPR ${total.toLocaleString()} has been placed.`,
    {
      type: "order_placed",
      orderId,
    },
    {
      channelId: "orders",
    },
  );
}

/**
 * Send new order alert to all admins
 */
export async function sendNewOrderToAdmins(
  orderId: string,
  orderNumber: string,
  customerName: string,
  total: number,
): Promise<ExpoPushTicket[]> {
  const User = (await import("../models/User")).default;
  const admins = await User.find({
    role: "admin",
    "pushTokens.0": { $exists: true },
    isActive: true,
  }).select("_id");

  if (admins.length === 0) {
    console.log("No admins with push tokens found");
    return [];
  }

  const adminIds = admins.map((a) => a._id.toString());

  return sendPushNotificationToMany(
    adminIds,
    "New Order Received! 🔔",
    `Order #${orderNumber} from ${customerName} - NPR ${total.toLocaleString()}`,
    {
      type: "new_order_admin",
      orderId,
    },
    {
      channelId: "orders",
    },
  );
}

/**
 * Send back-in-stock notification to a user
 */
export async function sendBackInStockNotification(
  userId: string,
  productName: string,
  productSlug: string,
): Promise<ExpoPushTicket[]> {
  return sendPushNotification(
    userId,
    "Back in Stock! 🎉",
    `"${productName}" is now available. Get it before it's gone!`,
    {
      type: "back_in_stock",
      productSlug,
    },
    {
      channelId: "promotions",
    },
  );
}

/**
 * Send featured product announcement to all users
 */
export async function sendFeaturedProductNotification(
  productName: string,
  productSlug: string,
  price: number,
): Promise<ExpoPushTicket[]> {
  return sendPromotionalNotification(
    "New Arrival! ✨",
    `Check out "${productName}" - NPR ${price.toLocaleString()}`,
    {
      type: "featured_product",
      productSlug,
    },
  );
}


/**
 * Internal function to send messages to Expo Push API
 */
async function sendPushMessages(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  // Expo recommends sending in batches of 100
  const BATCH_SIZE = 100;
  const tickets: ExpoPushTicket[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      const result = (await response.json()) as { data?: ExpoPushTicket[] };

      if (result.data) {
        tickets.push(...result.data);
      }
    } catch (error) {
      console.error("Error sending push notifications:", error);
      // Add error tickets for this batch
      batch.forEach(() => {
        tickets.push({
          status: "error",
          message: "Failed to send notification",
        });
      });
    }
  }

  // Log any errors and clean up invalid tokens
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === "error") {
      console.error(
        `Push notification error for message ${i}:`,
        ticket.message,
        ticket.details?.error
      );

      // Handle DeviceNotRegistered error
      if (ticket.details?.error === "DeviceNotRegistered") {
        // We need to find the token that caused this error
        // Since tickets map 1:1 to messages, we can use the index
        const invalidToken = messages[i]?.to;
        if (invalidToken) {
           // We need to import dynamically to avoid circular dependency if authService uses this service
           // But here authService doesn't import pushNotificationService, so it's fine. 
           // However, let's use the one we have or import if needed.
           // We'll trust the import at top of file for getUserPushTokens, 
           // but unregisterPushToken might not be exported from there in the original file view?
           // Let's check authService exports first. It exports unregisterPushToken.
           const { unregisterPushToken } = await import("./authService"); // Dynamic import to be safe
           
           // We need a user ID, but unregisterPushToken needs userId AND token.
           // Our current unregisterPushToken implementation requires userId.
           // This is a problem because we only have the token here.
           // We should update unregisterPushToken to work with just token, OR find user by token.
           
           // Let's try to find the user by token using the User model directly to be efficient
           const User = (await import("../models/User")).default;
           await User.updateOne(
             { "pushTokens.token": invalidToken },
             { $pull: { pushTokens: { token: invalidToken } } }
           );
           console.log(`Cleaned up invalid push token: ${invalidToken}`);
        }
      }
    }
  }

  return tickets;
}

export default {
  sendPushNotification,
  sendPushNotificationToMany,
  sendOrderStatusNotification,
  sendPromotionalNotification,
  sendOrderPlacedNotification,
  sendNewOrderToAdmins,
  sendBackInStockNotification,
  sendFeaturedProductNotification,
};

