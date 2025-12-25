"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const notification_schema_1 = require("../../database/schemas/notification.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let NotificationsService = class NotificationsService {
    constructor(notificationModel, productModel, srIssueModel, srPaymentModel, companyClaimModel) {
        this.notificationModel = notificationModel;
        this.productModel = productModel;
        this.srIssueModel = srIssueModel;
        this.srPaymentModel = srPaymentModel;
        this.companyClaimModel = companyClaimModel;
    }
    async findAll(unreadOnly = false) {
        const query = unreadOnly ? { read: false } : {};
        return this.notificationModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }
    async create(notification) {
        const newNotification = new this.notificationModel(notification);
        return newNotification.save();
    }
    async markAsRead(id) {
        return this.notificationModel
            .findByIdAndUpdate(id, { read: true, readAt: new Date() }, { new: true })
            .exec();
    }
    async markAllAsRead() {
        await this.notificationModel.updateMany({ read: false }, { read: true, readAt: new Date() }).exec();
    }
    async getUnreadCount() {
        return this.notificationModel.countDocuments({ read: false }).exec();
    }
    async checkLowStock() {
        const products = await this.productModel.find({ isActive: true }).exec();
        const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel && p.stock > 0);
        const outOfStockProducts = products.filter(p => p.stock === 0);
        const newNotifications = [];
        for (const product of lowStockProducts) {
            const existing = await this.notificationModel.findOne({
                'metadata.productId': product._id.toString(),
                category: notification_schema_1.NotificationCategory.STOCK,
                read: false,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).exec();
            if (!existing) {
                const notif = await this.create({
                    title: 'Low Stock Alert',
                    message: `${product.name} stock is below reorder level (${product.stock} ${product.unit} remaining)`,
                    type: notification_schema_1.NotificationType.WARNING,
                    category: notification_schema_1.NotificationCategory.STOCK,
                    link: `/products`,
                    metadata: { productId: product._id.toString(), stock: product.stock, reorderLevel: product.reorderLevel },
                });
                newNotifications.push(notif);
            }
        }
        for (const product of outOfStockProducts) {
            const existing = await this.notificationModel.findOne({
                'metadata.productId': product._id.toString(),
                category: notification_schema_1.NotificationCategory.STOCK,
                read: false,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).exec();
            if (!existing) {
                const notif = await this.create({
                    title: 'Out of Stock Alert',
                    message: `${product.name} is out of stock`,
                    type: notification_schema_1.NotificationType.ERROR,
                    category: notification_schema_1.NotificationCategory.STOCK,
                    link: `/products`,
                    metadata: { productId: product._id.toString(), stock: 0 },
                });
                newNotifications.push(notif);
            }
        }
        return newNotifications;
    }
    async checkPendingPayments() {
        const issues = await this.srIssueModel.find().exec();
        const newNotifications = [];
        for (const issue of issues) {
            const payments = await this.srPaymentModel.find({ issueId: issue._id }).exec();
            const totalPaid = payments.reduce((sum, p) => sum + p.totalReceived, 0);
            const due = issue.totalAmount - totalPaid;
            if (due > 1000) {
                const existing = await this.notificationModel.findOne({
                    'metadata.issueId': issue._id.toString(),
                    category: notification_schema_1.NotificationCategory.PAYMENT,
                    read: false,
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                }).exec();
                if (!existing) {
                    const notif = await this.create({
                        title: 'Pending SR Payment',
                        message: `SR Issue ${issue.issueNumber} has pending payment of ৳${due.toLocaleString()}`,
                        type: notification_schema_1.NotificationType.WARNING,
                        category: notification_schema_1.NotificationCategory.PAYMENT,
                        link: `/sr-payments`,
                        metadata: { issueId: issue._id.toString(), issueNumber: issue.issueNumber, due },
                    });
                    newNotifications.push(notif);
                }
            }
        }
        return newNotifications;
    }
    async checkPendingClaims() {
        const pendingClaims = await this.companyClaimModel
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .exec();
        const newNotifications = [];
        for (const claim of pendingClaims) {
            const claimDoc = claim;
            const claimCreatedAt = claimDoc.createdAt || new Date();
            const daysPending = Math.floor((Date.now() - new Date(claimCreatedAt).getTime()) / (24 * 60 * 60 * 1000));
            if (daysPending >= 3) {
                const existing = await this.notificationModel.findOne({
                    'metadata.claimId': claim._id.toString(),
                    category: notification_schema_1.NotificationCategory.CLAIM,
                    read: false,
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                }).exec();
                if (!existing) {
                    const notif = await this.create({
                        title: 'Pending Company Claim',
                        message: `Company claim ${claim.claimNumber} has been pending for ${daysPending} days`,
                        type: notification_schema_1.NotificationType.WARNING,
                        category: notification_schema_1.NotificationCategory.CLAIM,
                        link: `/company-claims`,
                        metadata: { claimId: claim._id.toString(), claimNumber: claim.claimNumber, daysPending },
                    });
                    newNotifications.push(notif);
                }
            }
        }
        return newNotifications;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(3, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(4, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map