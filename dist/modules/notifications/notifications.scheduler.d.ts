import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";
export declare class NotificationsScheduler {
    private readonly notificationsService;
    private readonly notificationsGateway;
    constructor(notificationsService: NotificationsService, notificationsGateway: NotificationsGateway);
    handleLowStockCheck(): Promise<void>;
    handlePendingPaymentsCheck(): Promise<void>;
    handlePendingClaimsCheck(): Promise<void>;
}
