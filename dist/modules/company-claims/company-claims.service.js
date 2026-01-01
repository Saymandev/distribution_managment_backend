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
exports.CompanyClaimsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let CompanyClaimsService = class CompanyClaimsService {
    constructor(companyClaimModel, companyModel, srPaymentModel, notificationsGateway) {
        this.companyClaimModel = companyClaimModel;
        this.companyModel = companyModel;
        this.srPaymentModel = srPaymentModel;
        this.notificationsGateway = notificationsGateway;
    }
    async create(dto) {
        const existing = await this.companyClaimModel
            .findOne({ claimNumber: dto.claimNumber })
            .exec();
        if (existing) {
            throw new common_1.ConflictException("Claim number already exists");
        }
        const company = await this.companyModel.findById(dto.companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        let totalDealerPrice = 0;
        let totalCommission = 0;
        let totalSRPayment = 0;
        const items = dto.items.map((item) => {
            const dealerPriceTotal = item.quantity * item.dealerPrice;
            const commissionAmount = dealerPriceTotal * (item.commissionRate / 100);
            const netFromCompany = dealerPriceTotal + commissionAmount - item.srPayment;
            totalDealerPrice += dealerPriceTotal;
            totalCommission += commissionAmount;
            totalSRPayment += item.srPayment;
            return Object.assign(Object.assign({}, item), { commissionAmount,
                netFromCompany });
        });
        const totalClaim = totalDealerPrice + totalCommission;
        const netFromCompany = totalClaim - totalSRPayment;
        const claim = new this.companyClaimModel({
            claimNumber: dto.claimNumber,
            companyId: dto.companyId,
            paymentId: dto.paymentId,
            items,
            totalDealerPrice,
            totalCommission,
            totalClaim,
            totalSRPayment,
            netFromCompany,
            status: dto.status || company_claim_schema_1.ClaimStatus.PENDING,
            notes: dto.notes,
        });
        const savedClaim = await claim.save();
        try {
            await this.notificationsGateway.emitClaimsDataRefresh();
        }
        catch (error) {
            console.error("Failed to emit claims data refresh:", error);
        }
        return savedClaim;
    }
    async findAll(companyId, page = 1, limit = 10, timePeriod = "all", searchQuery) {
        console.log("🔍 Backend: findAllCompanyClaims called for company:", companyId, "page:", page, "limit:", limit, "timePeriod:", timePeriod, "searchQuery:", searchQuery, "at:", new Date().toISOString());
        const matchConditions = {};
        if (companyId) {
            matchConditions.companyId = new mongoose_2.Types.ObjectId(companyId);
        }
        const dateFilter = {};
        const now = new Date();
        switch (timePeriod) {
            case "week":
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                dateFilter.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
                break;
            case "month":
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                startOfMonth.setHours(0, 0, 0, 0);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endOfMonth.setHours(23, 59, 59, 999);
                dateFilter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
                break;
            case "year":
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                startOfYear.setHours(0, 0, 0, 0);
                const endOfYear = new Date(now.getFullYear(), 11, 31);
                endOfYear.setHours(23, 59, 59, 999);
                dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
                break;
            case "all":
            default:
                break;
        }
        if (Object.keys(dateFilter).length > 0) {
            matchConditions.createdAt = dateFilter.createdAt;
        }
        if (searchQuery) {
            const searchRegex = new RegExp(searchQuery, "i");
            matchConditions.$or = [
                { claimNumber: searchRegex },
                { "companyInfo.name": searchRegex },
                { status: searchRegex },
            ];
        }
        const pipeline = [
            { $match: matchConditions },
            {
                $lookup: {
                    from: "companies",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                },
            },
            {
                $unwind: {
                    path: "$companyInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "srpayments",
                    localField: "paymentId",
                    foreignField: "_id",
                    as: "paymentInfo",
                },
            },
            {
                $unwind: {
                    path: "$paymentInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo",
                },
            },
            { $sort: { createdAt: -1 } },
        ];
        const totalCountResult = await this.companyClaimModel.aggregate([
            ...pipeline,
            { $count: "total" },
        ]);
        const totalItems = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
        const totalPages = Math.ceil(totalItems / limit);
        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit }, {
            $project: {
                _id: 1,
                claimNumber: 1,
                companyId: "$companyInfo",
                paymentId: "$paymentInfo",
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            productId: {
                                $arrayElemAt: [
                                    "$productInfo",
                                    { $indexOfArray: ["$productInfo._id", "$$item.productId"] },
                                ],
                            },
                            quantity: "$$item.quantity",
                            dealerPrice: "$$item.dealerPrice",
                            commissionRate: "$$item.commissionRate",
                            srPayment: "$$item.srPayment",
                            commissionAmount: "$$item.commissionAmount",
                            netFromCompany: "$$item.netFromCompany",
                        },
                    },
                },
                totalDealerPrice: 1,
                totalCommission: 1,
                totalClaim: 1,
                totalSRPayment: 1,
                netFromCompany: 1,
                status: 1,
                notes: 1,
                createdAt: 1,
                updatedAt: 1,
                paidDate: 1,
            },
        });
        const claims = await this.companyClaimModel.aggregate(pipeline);
        const result = {
            claims: claims,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
        console.log("📦 Company claims result (server-side):", {
            claimCount: result.claims.length,
            pagination: result.pagination,
        });
        return result;
    }
    async findOne(id) {
        const claim = await this.companyClaimModel
            .findById(id)
            .populate("companyId", "name code")
            .populate("paymentId", "receiptNumber")
            .populate("items.productId", "name sku")
            .exec();
        if (!claim) {
            throw new common_1.NotFoundException("Company Claim not found");
        }
        return claim;
    }
    async update(id, updateData) {
        const updated = await this.companyClaimModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Company Claim not found");
        }
        try {
            await this.notificationsGateway.emitClaimsDataRefresh();
        }
        catch (error) {
            console.error("Failed to emit claims data refresh:", error);
        }
        return updated;
    }
    async updateStatus(id, status, paidDate) {
        let updated;
        try {
            const updateData = { status };
            if (status === company_claim_schema_1.ClaimStatus.PAID && paidDate) {
                updateData.paidDate = paidDate;
            }
            updated = await this.companyClaimModel
                .findByIdAndUpdate(id, { $set: updateData }, { new: true })
                .exec();
            if (!updated) {
                throw new common_1.NotFoundException("Company Claim not found");
            }
        }
        catch (error) {
            console.error("❌ SERVICE: Error updating claim:", error);
            throw error;
        }
        if (status === company_claim_schema_1.ClaimStatus.PAID) {
            let paymentIdToUse = null;
            if (updated.paymentId) {
                if (typeof updated.paymentId === "string") {
                    paymentIdToUse = updated.paymentId;
                }
                else if (typeof updated.paymentId === "object" &&
                    updated.paymentId._id) {
                    paymentIdToUse = updated.paymentId._id;
                }
            }
            if (!paymentIdToUse ||
                (typeof paymentIdToUse === "string" && paymentIdToUse.trim() === "")) {
                if (updated.issueId) {
                    try {
                        const payments = await this.srPaymentModel
                            .find({
                            $or: [
                                { issueId: updated.issueId },
                                { issueId: new mongoose_2.Types.ObjectId(updated.issueId) },
                            ],
                        })
                            .exec();
                        if (payments.length > 0) {
                            const sortedPayments = payments.sort((a, b) => {
                                const aTime = a.createdAt
                                    ? new Date(a.createdAt).getTime()
                                    : 0;
                                const bTime = b.createdAt
                                    ? new Date(b.createdAt).getTime()
                                    : 0;
                                return bTime - aTime;
                            });
                            const latestPayment = sortedPayments[0];
                            paymentIdToUse = latestPayment._id.toString();
                            updated.paymentId = paymentIdToUse;
                            await updated.save();
                        }
                    }
                    catch (error) {
                        console.error("Failed to find payment by issueId:", error);
                    }
                }
            }
            if (paymentIdToUse) {
                try {
                    const payment = await this.srPaymentModel
                        .findById(paymentIdToUse)
                        .exec();
                    if (payment) {
                        const oldReceived = payment.receivedAmount || 0;
                        const newReceived = oldReceived + updated.totalCompanyClaim;
                        payment.receivedAmount = newReceived;
                        const savedPayment = await payment.save();
                        console.log("💰 Saved payment receivedAmount:", savedPayment.receivedAmount);
                        const verifyPayment = await this.srPaymentModel
                            .findById(paymentIdToUse)
                            .exec();
                        console.log("🔍 Verification - payment receivedAmount after save:", verifyPayment === null || verifyPayment === void 0 ? void 0 : verifyPayment.receivedAmount);
                        console.log("💰 Claim amount added:", updated.totalCompanyClaim);
                    }
                    else {
                        console.error("❌ Payment not found for update:", paymentIdToUse);
                    }
                }
                catch (error) {
                    console.error("Failed to update payment receivedAmount:", error);
                }
            }
        }
        setTimeout(async () => {
            try {
                console.log("📡 Emitting claims-data-refresh WebSocket event");
                await this.notificationsGateway.emitClaimsDataRefresh();
                console.log("✅ Claims data refresh event emitted successfully");
            }
            catch (error) {
                console.error("❌ Failed to emit claims data refresh:", error);
            }
        }, 100);
        return updated;
    }
};
exports.CompanyClaimsService = CompanyClaimsService;
exports.CompanyClaimsService = CompanyClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(2, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        notifications_gateway_1.NotificationsGateway])
], CompanyClaimsService);
//# sourceMappingURL=company-claims.service.js.map