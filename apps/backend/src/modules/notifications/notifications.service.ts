import { PrismaClient, getTenantedClient } from "@workspace/db";
import { Notification, MarkNotificationReadInput } from "@workspace/types";

export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listNotifications(
    centerId: string,
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getUnreadCount(centerId: string, userId: string): Promise<number> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(
    centerId: string,
    userId: string,
    input: MarkNotificationReadInput,
  ): Promise<number> {
    const db = getTenantedClient(this.prisma, centerId);
    const result = await db.notification.updateMany({
      where: {
        id: { in: input.notificationIds },
        userId, // Ensure user can only mark their own notifications
      },
      data: { read: true },
    });
    return result.count;
  }

  async markAllAsRead(centerId: string, userId: string): Promise<number> {
    const db = getTenantedClient(this.prisma, centerId);
    const result = await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  async createNotification(
    centerId: string,
    userId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.notification.create({
      data: {
        userId,
        centerId,
        title,
        message,
      },
    });
  }

  /**
   * Create notifications for multiple users at once
   */
  async createBulkNotifications(
    centerId: string,
    userIds: string[],
    title: string,
    message: string,
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    const db = getTenantedClient(this.prisma, centerId);
    const result = await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        centerId,
        title,
        message,
      })),
    });
    return result.count;
  }

  async deleteNotification(
    centerId: string,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    await db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user can only delete their own notifications
      },
    });
  }
}
