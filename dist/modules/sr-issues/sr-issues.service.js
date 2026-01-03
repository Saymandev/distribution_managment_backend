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
exports.SRIssuesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const product_return_schema_1 = require("../../database/schemas/product-return.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let SRIssuesService = class SRIssuesService {
    constructor(srIssueModel, productModel, salesRepModel, srPaymentModel, productReturnModel, companyClaimModel) {
        this.srIssueModel = srIssueModel;
        this.productModel = productModel;
        this.salesRepModel = salesRepModel;
        this.srPaymentModel = srPaymentModel;
        this.productReturnModel = productReturnModel;
        this.companyClaimModel = companyClaimModel;
    }
    async generateIssueNumber() {
        const lastIssue = await this.srIssueModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastIssue || !lastIssue.issueNumber) {
            return "ISSUE-001";
        }
        const match = lastIssue.issueNumber.match(/ISSUE-(\d+)/);
        if (!match) {
            return "ISSUE-001";
        }
        const lastNumber = parseInt(match[1] || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        return `ISSUE-${nextNumber}`;
    }
    async create(dto) {
        let issueNumber = dto.issueNumber;
        if (!issueNumber) {
            issueNumber = await this.generateIssueNumber();
        }
        const existing = await this.srIssueModel.findOne({ issueNumber }).exec();
        if (existing) {
            throw new common_1.ConflictException("Issue number already exists");
        }
        const sr = await this.salesRepModel.findById(dto.srId).exec();
        if (!sr) {
            throw new common_1.NotFoundException("Sales Rep not found");
        }
        const productQuantities = new Map();
        const productMap = new Map();
        for (const item of dto.items) {
            const product = await this.productModel.findById(item.productId).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            }
            const currentQty = productQuantities.get(item.productId) || 0;
            productQuantities.set(item.productId, currentQty + item.quantity);
            productMap.set(item.productId, product);
        }
        for (const [productId, totalQuantity] of productQuantities.entries()) {
            const product = productMap.get(productId);
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            if (product.stock < totalQuantity) {
                throw new common_1.ConflictException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${totalQuantity}`);
            }
        }
        let totalAmount = 0;
        for (const item of dto.items) {
            totalAmount += item.quantity * item.tradePrice;
        }
        const issue = new this.srIssueModel(Object.assign(Object.assign({}, dto), { issueNumber,
            totalAmount, issueDate: new Date() }));
        for (const item of dto.items) {
            await this.productModel
                .findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity },
            })
                .exec();
        }
        return issue.save();
    }
    async findAll(page = 1, limit = 10) {
        const { issues } = await this.getOptimized();
        const totalItems = issues.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return {
            issues: issues.slice(startIndex, endIndex),
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }
    async findOne(id) {
        const issue = await this.srIssueModel
            .findById(id)
            .populate("srId")
            .populate("items.productId")
            .lean()
            .exec();
        if (!issue) {
            throw new common_1.NotFoundException("SR Issue not found");
        }
        const paymentsForIssue = await this.srPaymentModel
            .find({
            $or: [
                { issueId: issue._id },
                { issueId: String(issue._id) },
                { issueId: new mongoose_2.Types.ObjectId(String(issue._id)) },
            ],
        })
            .lean()
            .exec();
        const totalReceivedAmount = paymentsForIssue.reduce((sum, payment) => sum + (payment.receivedAmount || 0), 0);
        const returnsForIssue = await this.productReturnModel
            .find({ issueId: issue._id })
            .populate("items.productId")
            .lean()
            .exec();
        let adjustedTotalAmount = issue.totalAmount || 0;
        for (const returnDoc of returnsForIssue) {
            for (const returnItem of returnDoc.items) {
                const product = await this.productModel
                    .findById(returnItem.productId)
                    .exec();
                if (product) {
                    const returnValue = returnItem.quantity * (product.tradePrice || 0);
                    adjustedTotalAmount -= returnValue;
                }
            }
        }
        adjustedTotalAmount = Math.max(0, adjustedTotalAmount);
        const companyClaimsForIssue = paymentsForIssue.reduce((sum, payment) => sum + (payment.companyClaim || 0), 0);
        const customerDuesForIssue = paymentsForIssue.reduce((sum, payment) => sum + (payment.customerDue || 0), 0);
        const due = customerDuesForIssue > 0
            ? customerDuesForIssue
            : Math.max(0, adjustedTotalAmount - totalReceivedAmount - companyClaimsForIssue);
        const enrichedIssue = Object.assign(Object.assign({}, issue), { calculatedTotalAmount: adjustedTotalAmount, calculatedReceivedAmount: totalReceivedAmount, calculatedDue: due });
        return enrichedIssue;
    }
    async findBySR(srId, page = 1, limit = 10) {
        const { issues } = await this.getOptimized();
        const filteredIssues = issues.filter((issue) => {
            var _a, _b;
            const issueSrId = typeof issue.srId === "string"
                ? issue.srId
                : (_b = (_a = issue.srId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
            return issueSrId === srId;
        });
        const totalAmount = filteredIssues.reduce((sum, issue) => sum + (issue.totalAmount || 0), 0);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedIssues = filteredIssues.slice(startIndex, endIndex);
        const totalItems = filteredIssues.length;
        const totalPages = Math.ceil(totalItems / limit);
        return {
            issues: paginatedIssues,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            totals: {
                totalAmount,
            },
        };
    }
    async getOptimized(companyId) {
        const [issues, salesReps, products, payments, returns, claims] = await Promise.all([
            this.srIssueModel
                .find()
                .populate("items.productId")
                .populate("srId")
                .lean()
                .sort({ issueDate: -1, createdAt: -1 })
                .exec(),
            this.salesRepModel
                .find(companyId ? { companyId } : {})
                .lean()
                .exec(),
            this.productModel
                .find(companyId ? { companyId } : {})
                .lean()
                .exec(),
            this.srPaymentModel.find().lean().exec(),
            this.productReturnModel
                .find()
                .populate("items.productId")
                .lean()
                .exec(),
            this.companyClaimModel.find().lean().exec(),
        ]);
        const productMap = new Map(products.map((p) => [String(p._id), p]));
        const issuePaymentMap = new Map();
        payments.forEach((p) => {
            var _a;
            const issueId = String(p.issueId);
            if (!issuePaymentMap.has(issueId)) {
                issuePaymentMap.set(issueId, []);
            }
            (_a = issuePaymentMap.get(issueId)) === null || _a === void 0 ? void 0 : _a.push(p);
        });
        const issueReturnMap = new Map();
        returns.forEach((r) => {
            var _a;
            const issueId = String(r.issueId);
            if (!issueReturnMap.has(issueId)) {
                issueReturnMap.set(issueId, []);
            }
            (_a = issueReturnMap.get(issueId)) === null || _a === void 0 ? void 0 : _a.push(r);
        });
        const dueAmounts = {};
        const enrichedIssues = [];
        for (const issue of issues) {
            const issueId = String(issue._id);
            let adjustedTotalAmount = issue.totalAmount || 0;
            let totalReceivedAmount = 0;
            const paymentsForIssue = issuePaymentMap.get(issueId) || [];
            totalReceivedAmount = paymentsForIssue.reduce((sum, payment) => sum + (payment.receivedAmount || 0), 0);
            const returnsForIssue = issueReturnMap.get(issueId) || [];
            for (const returnDoc of returnsForIssue) {
                for (const returnItem of returnDoc.items) {
                    const product = productMap.get(String(returnItem.productId));
                    if (product) {
                        const returnValue = returnItem.quantity * (product.tradePrice || 0);
                        adjustedTotalAmount -= returnValue;
                    }
                }
            }
            adjustedTotalAmount = Math.max(0, adjustedTotalAmount);
            let companyClaimsForIssue = 0;
            let customerDuesForIssue = 0;
            paymentsForIssue.forEach((payment) => {
                if (payment.customerDue && payment.customerDue > 0) {
                    customerDuesForIssue += payment.customerDue;
                }
                if (payment.companyClaim && payment.companyClaim > 0) {
                    const relatedClaim = claims.find((claim) => {
                        var _a;
                        const claimPaymentId = typeof claim.paymentId === "string"
                            ? claim.paymentId
                            : String(((_a = claim.paymentId) === null || _a === void 0 ? void 0 : _a._id) || claim.paymentId);
                        const paymentId = String(payment._id);
                        return claimPaymentId === paymentId && claim.status !== "paid";
                    });
                    if (relatedClaim) {
                        companyClaimsForIssue += payment.companyClaim;
                    }
                }
            });
            const hasOutstandingDues = customerDuesForIssue > 0 || companyClaimsForIssue > 0;
            const due = hasOutstandingDues
                ? customerDuesForIssue + companyClaimsForIssue
                : Math.max(0, adjustedTotalAmount - totalReceivedAmount);
            dueAmounts[issueId] = {
                totalAmount: adjustedTotalAmount,
                receivedAmount: totalReceivedAmount,
                due,
            };
            const enrichedIssue = Object.assign(Object.assign({}, issue), { calculatedTotalAmount: adjustedTotalAmount, calculatedReceivedAmount: totalReceivedAmount, calculatedDue: due });
            enrichedIssues.push(enrichedIssue);
        }
        enrichedIssues.sort((a, b) => {
            const dateA = new Date(a.issueDate || a.createdAt).getTime();
            const dateB = new Date(b.issueDate || b.createdAt).getTime();
            return dateB - dateA;
        });
        return {
            issues: enrichedIssues,
            salesReps,
            products,
            payments,
            returns,
            claims,
            dueAmounts,
        };
    }
};
exports.SRIssuesService = SRIssuesService;
exports.SRIssuesService = SRIssuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(salesrep_schema_1.SalesRep.name)),
    __param(3, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(4, (0, mongoose_1.InjectModel)(product_return_schema_1.ProductReturn.name)),
    __param(5, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SRIssuesService);
//# sourceMappingURL=sr-issues.service.js.map