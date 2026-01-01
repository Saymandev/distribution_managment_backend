import { NotificationsService } from "./notifications.service";
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(unreadOnly?: string): Promise<import("../../database/schemas/notification.schema").Notification[]>;
    getUnreadCount(): Promise<{
        count: number;
    }>;
    markAsRead(id: string): Promise<import("../../database/schemas/notification.schema").Notification>;
    markAllAsRead(): Promise<void>;
}
