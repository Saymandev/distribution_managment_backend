import { Model } from 'mongoose';
import { CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { ProductDocument } from '../../database/schemas/product.schema';
import { SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
export declare class NotificationsService {
    private readonly notificationModel;
    private readonly productModel;
    private readonly srIssueModel;
    private readonly srPaymentModel;
    private readonly companyClaimModel;
    constructor(notificationModel: Model<NotificationDocument>, productModel: Model<ProductDocument>, srIssueModel: Model<SRIssueDocument>, srPaymentModel: Model<SRPaymentDocument>, companyClaimModel: Model<CompanyClaimDocument>);
    findAll(unreadOnly?: boolean): Promise<Notification[]>;
    create(notification: Partial<Notification>): Promise<NotificationDocument>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(): Promise<void>;
    getUnreadCount(): Promise<number>;
    checkLowStock(): Promise<NotificationDocument[]>;
    checkPendingPayments(): Promise<NotificationDocument[]>;
    checkPendingClaims(): Promise<NotificationDocument[]>;
}
