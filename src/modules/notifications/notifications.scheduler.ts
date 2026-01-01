import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class NotificationsScheduler {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Run every hour to check low stock
  @Cron(CronExpression.EVERY_HOUR)
  async handleLowStockCheck() {
    console.log("🔔 Running low stock check...");
    const notifications = await this.notificationsService.checkLowStock();
    // Emit new notifications to connected clients
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        // Convert Mongoose document to plain object
        const notifObj = notif.toObject
          ? notif.toObject()
          : JSON.parse(JSON.stringify(notif));
        this.notificationsGateway.emitNewNotification(notifObj);
      });
    }
    const unreadCount = await this.notificationsService.getUnreadCount();
    this.notificationsGateway.server
      .to("notifications")
      .emit("unread-count", unreadCount);
  }

  // Run every 6 hours to check pending payments
  @Cron("0 */6 * * *")
  async handlePendingPaymentsCheck() {
    console.log("🔔 Running pending payments check...");
    const notifications =
      await this.notificationsService.checkPendingPayments();
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        // Convert Mongoose document to plain object
        const notifObj = notif.toObject
          ? notif.toObject()
          : JSON.parse(JSON.stringify(notif));
        this.notificationsGateway.emitNewNotification(notifObj);
      });
    }
    const unreadCount = await this.notificationsService.getUnreadCount();
    this.notificationsGateway.server
      .to("notifications")
      .emit("unread-count", unreadCount);
  }

  // Run daily at 9 AM to check pending claims
  @Cron("0 9 * * *")
  async handlePendingClaimsCheck() {
    console.log("🔔 Running pending claims check...");
    const notifications = await this.notificationsService.checkPendingClaims();
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        // Convert Mongoose document to plain object
        const notifObj = notif.toObject
          ? notif.toObject()
          : JSON.parse(JSON.stringify(notif));
        this.notificationsGateway.emitNewNotification(notifObj);
      });
    }
    const unreadCount = await this.notificationsService.getUnreadCount();
    this.notificationsGateway.server
      .to("notifications")
      .emit("unread-count", unreadCount);
  }
}
