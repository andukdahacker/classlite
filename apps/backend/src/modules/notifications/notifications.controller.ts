import {
  MarkNotificationReadInput,
  NotificationListResponse,
  UnreadCountResponse,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { NotificationsService } from "./notifications.service.js";

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  async listNotifications(
    user: JwtPayload,
    limit?: number,
  ): Promise<NotificationListResponse> {
    const centerId = user.centerId;
    const userId = user.uid;
    if (!centerId || !userId) {
      throw new Error("Center ID or User ID missing from token");
    }

    const notifications = await this.notificationsService.listNotifications(
      centerId,
      userId,
      limit,
    );
    return {
      data: notifications,
      message: "Notifications retrieved successfully",
    };
  }

  async getUnreadCount(user: JwtPayload): Promise<UnreadCountResponse> {
    const centerId = user.centerId;
    const userId = user.uid;
    if (!centerId || !userId) {
      throw new Error("Center ID or User ID missing from token");
    }

    const count = await this.notificationsService.getUnreadCount(
      centerId,
      userId,
    );
    return {
      data: { count },
      message: "Unread count retrieved successfully",
    };
  }

  async markAsRead(
    input: MarkNotificationReadInput,
    user: JwtPayload,
  ): Promise<{ message: string; markedCount: number }> {
    const centerId = user.centerId;
    const userId = user.uid;
    if (!centerId || !userId) {
      throw new Error("Center ID or User ID missing from token");
    }

    const markedCount = await this.notificationsService.markAsRead(
      centerId,
      userId,
      input,
    );
    return {
      message: "Notifications marked as read",
      markedCount,
    };
  }

  async markAllAsRead(
    user: JwtPayload,
  ): Promise<{ message: string; markedCount: number }> {
    const centerId = user.centerId;
    const userId = user.uid;
    if (!centerId || !userId) {
      throw new Error("Center ID or User ID missing from token");
    }

    const markedCount = await this.notificationsService.markAllAsRead(
      centerId,
      userId,
    );
    return {
      message: "All notifications marked as read",
      markedCount,
    };
  }

  async deleteNotification(
    notificationId: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    const userId = user.uid;
    if (!centerId || !userId) {
      throw new Error("Center ID or User ID missing from token");
    }

    await this.notificationsService.deleteNotification(
      centerId,
      userId,
      notificationId,
    );
    return {
      message: "Notification deleted successfully",
    };
  }
}
