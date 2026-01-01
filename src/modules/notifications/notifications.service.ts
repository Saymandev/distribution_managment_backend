import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  CompanyClaim,
  CompanyClaimDocument,
} from "../../database/schemas/company-claim.schema";
import {
  Notification,
  NotificationCategory,
  NotificationDocument,
  NotificationType,
} from "../../database/schemas/notification.schema";
import {
  Product,
  ProductDocument,
} from "../../database/schemas/product.schema";
import {
  SRIssue,
  SRIssueDocument,
} from "../../database/schemas/sr-issue.schema";
import {
  SRPayment,
  SRPaymentDocument,
} from "../../database/schemas/sr-payment.schema";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(SRIssue.name)
    private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
  ) {}

  async findAll(unreadOnly: boolean = false): Promise<Notification[]> {
    const query = unreadOnly ? { read: false } : {};
    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  async create(
    notification: Partial<Notification>,
  ): Promise<NotificationDocument> {
    const newNotification = new this.notificationModel(notification);
    return newNotification.save();
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.notificationModel
      .findByIdAndUpdate(id, { read: true, readAt: new Date() }, { new: true })
      .exec();
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationModel
      .updateMany({ read: false }, { read: true, readAt: new Date() })
      .exec();
  }

  async getUnreadCount(): Promise<number> {
    return this.notificationModel.countDocuments({ read: false }).exec();
  }

  // Cron job: Check for low stock products
  async checkLowStock(): Promise<NotificationDocument[]> {
    const products = await this.productModel.find({ isActive: true }).exec();
    const lowStockProducts = products.filter(
      (p) => p.stock <= p.reorderLevel && p.stock > 0,
    );
    const outOfStockProducts = products.filter((p) => p.stock === 0);

    const newNotifications: NotificationDocument[] = [];

    // Create notifications for low stock
    for (const product of lowStockProducts) {
      const existing = await this.notificationModel
        .findOne({
          "metadata.productId": product._id.toString(),
          category: NotificationCategory.STOCK,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        })
        .exec();

      if (!existing) {
        const notif = await this.create({
          title: "Low Stock Alert",
          message: `${product.name} stock is below reorder level (${product.stock} ${product.unit} remaining)`,
          type: NotificationType.WARNING,
          category: NotificationCategory.STOCK,
          link: `/products`,
          metadata: {
            productId: product._id.toString(),
            stock: product.stock,
            reorderLevel: product.reorderLevel,
          },
        });
        newNotifications.push(notif);
      }
    }

    // Create notifications for out of stock
    for (const product of outOfStockProducts) {
      const existing = await this.notificationModel
        .findOne({
          "metadata.productId": product._id.toString(),
          category: NotificationCategory.STOCK,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
        .exec();

      if (!existing) {
        const notif = await this.create({
          title: "Out of Stock Alert",
          message: `${product.name} is out of stock`,
          type: NotificationType.ERROR,
          category: NotificationCategory.STOCK,
          link: `/products`,
          metadata: { productId: product._id.toString(), stock: 0 },
        });
        newNotifications.push(notif);
      }
    }

    return newNotifications;
  }

  // Cron job: Check for pending SR payments
  async checkPendingPayments(): Promise<NotificationDocument[]> {
    // Get all SR issues
    const issues = await this.srIssueModel.find().exec();
    const newNotifications: NotificationDocument[] = [];

    for (const issue of issues) {
      // Get payments for this issue
      const payments = await this.srPaymentModel
        .find({ issueId: issue._id })
        .exec();
      const totalPaid = payments.reduce((sum, p) => sum + p.totalReceived, 0);
      const due = issue.totalAmount - totalPaid;

      // If there's a significant due amount and no recent notification
      if (due > 1000) {
        // More than 1000 tk due
        const existing = await this.notificationModel
          .findOne({
            "metadata.issueId": issue._id.toString(),
            category: NotificationCategory.PAYMENT,
            read: false,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          })
          .exec();

        if (!existing) {
          const notif = await this.create({
            title: "Pending SR Payment",
            message: `SR Issue ${issue.issueNumber} has pending payment of ৳${due.toLocaleString()}`,
            type: NotificationType.WARNING,
            category: NotificationCategory.PAYMENT,
            link: `/sr-payments`,
            metadata: {
              issueId: issue._id.toString(),
              issueNumber: issue.issueNumber,
              due,
            },
          });
          newNotifications.push(notif);
        }
      }
    }

    return newNotifications;
  }

  // Cron job: Check for pending company claims
  async checkPendingClaims(): Promise<NotificationDocument[]> {
    const pendingClaims = await this.companyClaimModel
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .exec();

    const newNotifications: NotificationDocument[] = [];

    for (const claim of pendingClaims) {
      // CompanyClaim schema has timestamps: true, so createdAt exists
      const claimDoc = claim as any;
      const claimCreatedAt = claimDoc.createdAt || new Date();
      const daysPending = Math.floor(
        (Date.now() - new Date(claimCreatedAt).getTime()) /
          (24 * 60 * 60 * 1000),
      );

      // Notify if claim is pending for more than 3 days
      if (daysPending >= 3) {
        const existing = await this.notificationModel
          .findOne({
            "metadata.claimId": claim._id.toString(),
            category: NotificationCategory.CLAIM,
            read: false,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          })
          .exec();

        if (!existing) {
          const notif = await this.create({
            title: "Pending Company Claim",
            message: `Company claim ${claim.claimNumber} has been pending for ${daysPending} days`,
            type: NotificationType.WARNING,
            category: NotificationCategory.CLAIM,
            link: `/company-claims`,
            metadata: {
              claimId: claim._id.toString(),
              claimNumber: claim.claimNumber,
              daysPending,
            },
          });
          newNotifications.push(notif);
        }
      }
    }

    return newNotifications;
  }
}
