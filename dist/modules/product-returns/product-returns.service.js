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
exports.ProductReturnsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const product_return_schema_1 = require("../../database/schemas/product-return.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let ProductReturnsService = class ProductReturnsService {
    constructor(productReturnModel, productModel, srIssueModel, srPaymentModel, companyClaimModel, companyModel) {
        this.productReturnModel = productReturnModel;
        this.productModel = productModel;
        this.srIssueModel = srIssueModel;
        this.srPaymentModel = srPaymentModel;
        this.companyClaimModel = companyClaimModel;
        this.companyModel = companyModel;
    }
    async create(dto) {
        var _a, _b;
        const existing = await this.productReturnModel.findOne({ returnNumber: dto.returnNumber }).exec();
        if (existing) {
            throw new common_1.ConflictException('Return number already exists');
        }
        if (dto.returnType === product_return_schema_1.ReturnType.CUSTOMER_RETURN) {
            if (!dto.customerId && !dto.srId && !dto.issueId) {
                throw new common_1.BadRequestException('Customer return must have either customerId, srId, or issueId');
            }
            if (dto.issueId) {
                const issue = await this.srIssueModel.findById(dto.issueId).exec();
                if (!issue) {
                    throw new common_1.NotFoundException(`Issue ${dto.issueId} not found`);
                }
            }
        }
        else if (dto.returnType === product_return_schema_1.ReturnType.DAMAGE_RETURN) {
            if (!dto.companyId && !dto.issueId) {
                throw new common_1.BadRequestException('Damage return must have either companyId or issueId');
            }
            if (dto.issueId && !dto.companyId) {
                const issue = await this.srIssueModel.findById(dto.issueId).populate('items.productId').exec();
                if (!issue) {
                    throw new common_1.NotFoundException(`Issue ${dto.issueId} not found`);
                }
                if (issue.items && issue.items.length > 0) {
                    const firstItem = issue.items[0];
                    const productId = typeof firstItem.productId === 'string'
                        ? firstItem.productId
                        : (_a = firstItem.productId) === null || _a === void 0 ? void 0 : _a._id;
                    const product = await this.productModel.findById(productId).exec();
                    if (product) {
                        const companyId = typeof product.companyId === 'string'
                            ? product.companyId
                            : (_b = product.companyId) === null || _b === void 0 ? void 0 : _b._id;
                        dto.companyId = companyId;
                    }
                }
            }
        }
        for (const item of dto.items) {
            const product = await this.productModel.findById(item.productId).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            }
        }
        const returnRecord = new this.productReturnModel(Object.assign(Object.assign({}, dto), { status: product_return_schema_1.ReturnStatus.PENDING, returnDate: new Date() }));
        const saved = await returnRecord.save();
        if (dto.returnType === product_return_schema_1.ReturnType.CUSTOMER_RETURN) {
            for (const item of dto.items) {
                await this.productModel.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.quantity },
                }).exec();
            }
        }
        else if (dto.returnType === product_return_schema_1.ReturnType.DAMAGE_RETURN) {
        }
        if (dto.issueId) {
            await this.adjustIssueForReturn(dto.issueId, dto.items);
        }
        return saved;
    }
    async findAll() {
        return this.productReturnModel
            .find()
            .populate('customerId', 'name code')
            .populate('srId', 'name phone')
            .populate('companyId', 'name code')
            .populate('items.productId', 'name sku')
            .sort({ returnDate: -1 })
            .exec();
    }
    async findOne(id) {
        const returnRecord = await this.productReturnModel
            .findById(id)
            .populate('customerId')
            .populate('srId')
            .populate('companyId')
            .populate('items.productId')
            .exec();
        if (!returnRecord) {
            throw new common_1.NotFoundException('Product Return not found');
        }
        return returnRecord;
    }
    async updateStatus(id, status) {
        var _a;
        const returnRecord = await this.productReturnModel.findById(id).exec();
        if (!returnRecord) {
            throw new common_1.NotFoundException('Product Return not found');
        }
        const previousStatus = returnRecord.status;
        const updated = await this.productReturnModel
            .findByIdAndUpdate(id, { $set: { status } }, { new: true })
            .exec();
        if (status === product_return_schema_1.ReturnStatus.RETURNED && previousStatus !== product_return_schema_1.ReturnStatus.RETURNED) {
            if (returnRecord.returnType === product_return_schema_1.ReturnType.DAMAGE_RETURN) {
                for (const item of returnRecord.items) {
                    const productId = typeof item.productId === 'string'
                        ? item.productId
                        : (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id;
                    await this.productModel.findByIdAndUpdate(productId, {
                        $inc: { stock: item.quantity },
                    }).exec();
                }
            }
        }
        return updated;
    }
    async adjustIssueForReturn(issueId, returnItems) {
        var _a, _b;
        const issue = await this.srIssueModel.findById(issueId).exec();
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        const returnedQuantities = new Map();
        returnItems.forEach(item => {
            const current = returnedQuantities.get(item.productId) || 0;
            returnedQuantities.set(item.productId, current + item.quantity);
        });
        const originalTotal = issue.totalAmount || 0;
        let newTotalAmount = 0;
        const adjustedItems = issue.items.map(issueItem => {
            var _a;
            const productId = typeof issueItem.productId === 'string'
                ? issueItem.productId
                : (_a = issueItem.productId) === null || _a === void 0 ? void 0 : _a._id;
            const returnedQty = returnedQuantities.get(productId) || 0;
            const newQuantity = Math.max(0, issueItem.quantity - returnedQty);
            newTotalAmount += newQuantity * issueItem.dealerPrice;
            return {
                productId,
                quantity: newQuantity,
                dealerPrice: issueItem.dealerPrice,
                tradePrice: issueItem.tradePrice,
            };
        });
        issue.items = adjustedItems;
        issue.totalAmount = newTotalAmount;
        await issue.save();
        const payment = await this.srPaymentModel.findOne({ issueId }).exec();
        if (payment && originalTotal > 0) {
            const originalReceived = payment.totalReceived;
            let totalExpected = 0;
            let totalDiscount = 0;
            const paymentItems = adjustedItems.map(issueItem => {
                const expectedItemAmount = issueItem.quantity * issueItem.dealerPrice;
                totalExpected += expectedItemAmount;
                return {
                    productId: issueItem.productId,
                    quantity: issueItem.quantity,
                    dealerPrice: issueItem.dealerPrice,
                    tradePrice: issueItem.tradePrice,
                    discount: 0,
                };
            });
            totalDiscount = Math.max(0, totalExpected - originalReceived);
            const receivedRatio = totalExpected > 0 ? originalReceived / totalExpected : 0;
            const adjustedPaymentItems = paymentItems.map(item => {
                const expectedItemAmount = item.quantity * item.dealerPrice;
                const receivedItemAmount = expectedItemAmount * receivedRatio;
                const tradePricePerUnit = item.quantity > 0 ? receivedItemAmount / item.quantity : 0;
                const itemDiscount = expectedItemAmount - receivedItemAmount;
                return Object.assign(Object.assign({}, item), { tradePrice: tradePricePerUnit, discount: itemDiscount });
            });
            payment.items = adjustedPaymentItems;
            payment.totalExpected = totalExpected;
            payment.totalReceived = originalReceived;
            payment.totalDiscount = totalDiscount;
            await payment.save();
            let claim = await this.companyClaimModel.findOne({ issueId }).exec();
            if (!claim) {
                claim = await this.companyClaimModel.findOne({ paymentId: payment._id }).exec();
            }
            if (claim) {
                const firstProduct = await this.productModel.findById((_a = adjustedItems[0]) === null || _a === void 0 ? void 0 : _a.productId).exec();
                if (firstProduct) {
                    const companyId = typeof firstProduct.companyId === 'string'
                        ? firstProduct.companyId
                        : (_b = firstProduct.companyId) === null || _b === void 0 ? void 0 : _b._id;
                    const company = await this.companyModel.findById(companyId).exec();
                    if (company) {
                        const commissionRate = company.commissionRate || 0;
                        const claimItems = adjustedPaymentItems.map(paymentItem => {
                            const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
                            const commissionAmount = dealerPriceTotal * (commissionRate / 100);
                            const srPayment = paymentItem.quantity * paymentItem.tradePrice;
                            const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;
                            return {
                                productId: paymentItem.productId,
                                quantity: paymentItem.quantity,
                                dealerPrice: paymentItem.dealerPrice,
                                commissionRate,
                                commissionAmount,
                                srPayment,
                                netFromCompany,
                            };
                        });
                        const totalDealerPrice = claimItems.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
                        const totalCommission = claimItems.reduce((sum, item) => sum + item.commissionAmount, 0);
                        const totalClaim = totalDealerPrice + totalCommission;
                        const totalSRPayment = payment.totalReceived;
                        const netFromCompany = totalClaim - totalSRPayment;
                        claim.items = claimItems;
                        claim.totalDealerPrice = totalDealerPrice;
                        claim.totalCommission = totalCommission;
                        claim.totalClaim = totalClaim;
                        claim.totalSRPayment = totalSRPayment;
                        claim.netFromCompany = netFromCompany;
                        await claim.save();
                    }
                }
            }
        }
    }
};
exports.ProductReturnsService = ProductReturnsService;
exports.ProductReturnsService = ProductReturnsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_return_schema_1.ProductReturn.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(3, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(4, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(5, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ProductReturnsService);
//# sourceMappingURL=product-returns.service.js.map