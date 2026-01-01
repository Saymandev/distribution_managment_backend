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
exports.SRPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const product_return_schema_1 = require("../../database/schemas/product-return.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let SRPaymentsService = class SRPaymentsService {
    constructor(srPaymentModel, salesRepModel, srIssueModel, productModel, companyModel, companyClaimModel, productReturnModel) {
        this.srPaymentModel = srPaymentModel;
        this.salesRepModel = salesRepModel;
        this.srIssueModel = srIssueModel;
        this.productModel = productModel;
        this.companyModel = companyModel;
        this.companyClaimModel = companyClaimModel;
        this.productReturnModel = productReturnModel;
    }
    async generateReceiptNumber() {
        const lastPayment = await this.srPaymentModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastPayment || !lastPayment.receiptNumber) {
            return "PAY-001";
        }
        const match = lastPayment.receiptNumber.match(/PAY-(\d+)/);
        if (!match) {
            return "PAY-001";
        }
        const lastNumber = parseInt(match[1] || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        return `PAY-${nextNumber}`;
    }
    async generateClaimNumber() {
        const lastClaim = await this.companyClaimModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastClaim || !lastClaim.claimNumber) {
            return "CLAIM-001";
        }
        const match = lastClaim.claimNumber.match(/CLAIM-(\d+)/);
        if (!match) {
            return "CLAIM-001";
        }
        const lastNumber = parseInt(match[1] || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        return `CLAIM-${nextNumber}`;
    }
    async createClaimFromPayment(payment) {
        var _a, _b, _c, _d;
        if (!payment.issueId) {
            throw new common_1.NotFoundException("Issue ID is required to create a claim");
        }
        let paymentIssueId;
        if (typeof payment.issueId === "string") {
            paymentIssueId = mongoose_2.Types.ObjectId.isValid(payment.issueId)
                ? new mongoose_2.Types.ObjectId(payment.issueId)
                : payment.issueId;
        }
        else if (payment.issueId &&
            typeof payment.issueId === "object" &&
            "_id" in payment.issueId) {
            paymentIssueId = payment.issueId._id;
        }
        else {
            paymentIssueId = payment.issueId;
        }
        const existingClaimByIssue = await this.companyClaimModel
            .findOne({
            $or: [
                { issueId: paymentIssueId },
                { issueId: String(paymentIssueId) },
                { issueId: new mongoose_2.Types.ObjectId(String(paymentIssueId)) },
            ],
        })
            .exec();
        if (existingClaimByIssue) {
            return this.updateClaimFromPayment(payment);
        }
        const paymentIdString = String(payment._id);
        const existingClaimByPayment = await this.companyClaimModel
            .findOne({
            $or: [{ paymentId: paymentIdString }, { paymentId: payment._id }],
        })
            .exec();
        if (existingClaimByPayment) {
            return this.updateClaimFromPayment(payment);
        }
        const productIds = payment.items.map((item) => {
            if (typeof item.productId === "string") {
                return item.productId;
            }
            else if (item.productId &&
                typeof item.productId === "object" &&
                "_id" in item.productId) {
                return item.productId._id;
            }
            throw new common_1.NotFoundException("Invalid product ID in payment items");
        });
        const products = await this.productModel
            .find({ _id: { $in: productIds } })
            .exec();
        if (products.length === 0) {
            throw new common_1.NotFoundException("Products not found");
        }
        const companyId = typeof products[0].companyId === "string"
            ? products[0].companyId
            : ((_a = products[0].companyId) === null || _a === void 0 ? void 0 : _a._id) || products[0].companyId;
        const company = await this.companyModel.findById(companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        const claimItems = payment.items.map((paymentItem) => {
            var _a;
            const productId = typeof paymentItem.productId === "string"
                ? paymentItem.productId
                : ((_a = paymentItem.productId) === null || _a === void 0 ? void 0 : _a._id) || paymentItem.productId;
            const product = products.find((p) => p._id.toString() === productId.toString());
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            const discount = paymentItem.quantity *
                (paymentItem.dealerPrice - paymentItem.tradePrice);
            return {
                productId,
                quantity: paymentItem.quantity,
                dealerPrice: paymentItem.dealerPrice,
                tradePrice: paymentItem.tradePrice,
                discount,
                srPayment: paymentItem.quantity * paymentItem.tradePrice,
                netFromCompany: discount,
            };
        });
        const totalDealerPrice = claimItems.reduce((sum, item) => sum + item.quantity * item.dealerPrice, 0);
        const totalCompanyClaim = payment.companyClaim || 0;
        const totalSRPayment = claimItems.reduce((sum, item) => sum + item.srPayment, 0);
        const netFromCompany = totalCompanyClaim;
        const claimNumber = await this.generateClaimNumber();
        const claimIssueId = typeof payment.issueId === "string"
            ? payment.issueId
            : ((_c = (_b = payment.issueId) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) ||
                ((_d = payment.issueId) === null || _d === void 0 ? void 0 : _d._id);
        const claim = new this.companyClaimModel({
            claimNumber,
            companyId,
            paymentId: payment._id,
            issueId: claimIssueId,
            items: claimItems,
            totalDealerPrice,
            totalCompanyClaim,
            totalSRPayment,
            netFromCompany,
            status: company_claim_schema_1.ClaimStatus.PENDING,
            notes: `Auto-generated from payment ${payment.receiptNumber}`,
        });
        return claim.save();
    }
    async updateClaimFromPayment(payment) {
        var _a, _b;
        if (!payment.issueId) {
            throw new common_1.NotFoundException("Issue ID is required to update a claim");
        }
        let updateIssueId;
        if (typeof payment.issueId === "string") {
            updateIssueId = mongoose_2.Types.ObjectId.isValid(payment.issueId)
                ? new mongoose_2.Types.ObjectId(payment.issueId)
                : payment.issueId;
        }
        else if (payment.issueId &&
            typeof payment.issueId === "object" &&
            "_id" in payment.issueId) {
            updateIssueId = payment.issueId._id;
        }
        else {
            updateIssueId = payment.issueId;
        }
        let existingClaim = await this.companyClaimModel
            .findOne({
            $or: [
                { issueId: updateIssueId },
                { issueId: String(updateIssueId) },
                { issueId: new mongoose_2.Types.ObjectId(String(updateIssueId)) },
            ],
        })
            .exec();
        if (!existingClaim) {
            const paymentIdString = String(payment._id);
            existingClaim = await this.companyClaimModel
                .findOne({
                $or: [{ paymentId: paymentIdString }, { paymentId: payment._id }],
            })
                .exec();
        }
        if (!existingClaim) {
            return this.createClaimFromPayment(payment);
        }
        const productIds = payment.items.map((item) => {
            if (typeof item.productId === "string") {
                return item.productId;
            }
            else if (item.productId &&
                typeof item.productId === "object" &&
                "_id" in item.productId) {
                return item.productId._id;
            }
            throw new common_1.NotFoundException("Invalid product ID in payment items");
        });
        const products = await this.productModel
            .find({ _id: { $in: productIds } })
            .exec();
        if (products.length === 0) {
            throw new common_1.NotFoundException("Products not found");
        }
        const companyId = typeof products[0].companyId === "string"
            ? products[0].companyId
            : ((_a = products[0].companyId) === null || _a === void 0 ? void 0 : _a._id) || products[0].companyId;
        const company = await this.companyModel.findById(companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        const claimItems = payment.items.map((paymentItem) => {
            var _a;
            const productId = typeof paymentItem.productId === "string"
                ? paymentItem.productId
                : ((_a = paymentItem.productId) === null || _a === void 0 ? void 0 : _a._id) || paymentItem.productId;
            const product = products.find((p) => p._id.toString() === productId.toString());
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            const discount = paymentItem.quantity *
                (paymentItem.dealerPrice - paymentItem.tradePrice);
            return {
                productId,
                quantity: paymentItem.quantity,
                dealerPrice: paymentItem.dealerPrice,
                tradePrice: paymentItem.tradePrice,
                discount,
                srPayment: paymentItem.quantity * paymentItem.tradePrice,
                netFromCompany: discount,
            };
        });
        const totalDealerPrice = claimItems.reduce((sum, item) => sum + item.quantity * item.dealerPrice, 0);
        const totalCompanyClaim = payment.companyClaim || 0;
        const totalSRPayment = claimItems.reduce((sum, item) => sum + item.srPayment, 0);
        const netFromCompany = totalCompanyClaim;
        const finalIssueId = typeof payment.issueId === "string"
            ? payment.issueId
            : String(((_b = payment.issueId) === null || _b === void 0 ? void 0 : _b._id) || payment.issueId);
        existingClaim.items = claimItems;
        existingClaim.totalDealerPrice = totalDealerPrice;
        existingClaim.totalCompanyClaim = totalCompanyClaim;
        existingClaim.totalSRPayment = totalSRPayment;
        existingClaim.netFromCompany = netFromCompany;
        existingClaim.paymentId = String(payment._id);
        existingClaim.issueId = finalIssueId;
        existingClaim.notes = `Auto-updated from payment ${payment.receiptNumber}`;
        return existingClaim.save();
    }
    async create(dto) {
        if (dto.receiptNumber === null ||
            (dto.receiptNumber !== undefined && dto.receiptNumber.trim() === "")) {
            dto.receiptNumber = undefined;
        }
        if (dto.items && dto.items.length > 0) {
            const totalExpected = dto.items.reduce((sum, item) => sum + item.quantity * item.dealerPrice, 0);
            const totalReceived = dto.items.reduce((sum, item) => sum + item.quantity * item.tradePrice, 0);
            const items = dto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                dealerPrice: item.dealerPrice,
                tradePrice: item.tradePrice,
                expected: item.quantity * item.dealerPrice,
                received: item.quantity * item.tradePrice,
            }));
        }
        if (dto.issueId) {
            const issueIdString = typeof dto.issueId === "string" ? dto.issueId : String(dto.issueId);
            const existingPayment = await this.srPaymentModel
                .findOne({
                issueId: issueIdString,
            })
                .exec();
            if (existingPayment) {
                let totalExpectedFromDto = 0;
                let totalDiscountFromDto = 0;
                const processedItems = dto.items.map((item) => {
                    var _a;
                    const expected = item.quantity * item.dealerPrice;
                    const received = item.quantity * item.tradePrice;
                    const discount = expected - received;
                    totalExpectedFromDto += expected;
                    totalDiscountFromDto += discount;
                    return {
                        productId: typeof item.productId === "string"
                            ? item.productId
                            : (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id,
                        quantity: item.quantity,
                        dealerPrice: item.dealerPrice,
                        tradePrice: item.tradePrice,
                        discount,
                    };
                });
                existingPayment.items = processedItems;
                existingPayment.totalExpected = totalExpectedFromDto;
                existingPayment.totalReceived =
                    (existingPayment.totalReceived || 0) + (dto.receivedAmount || 0);
                existingPayment.totalDiscount = totalDiscountFromDto;
                existingPayment.receivedAmount =
                    (existingPayment.receivedAmount || 0) + (dto.receivedAmount || 0);
                existingPayment.paymentMethod = dto.paymentMethod;
                existingPayment.paymentDate = new Date();
                if (dto.companyClaim !== undefined) {
                    existingPayment.companyClaim = dto.companyClaim;
                }
                if (dto.customerInfo !== undefined) {
                    existingPayment.customerInfo = dto.customerInfo;
                }
                if (dto.customerDue !== undefined) {
                    existingPayment.customerDue = dto.customerDue;
                }
                if (dto.notes) {
                    existingPayment.notes = existingPayment.notes
                        ? `${existingPayment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
                        : dto.notes;
                }
                const savedPayment = await existingPayment.save();
                if (savedPayment.companyClaim && savedPayment.companyClaim > 0) {
                    try {
                        await this.updateClaimFromPayment(savedPayment);
                    }
                    catch (error) {
                        console.error("Failed to auto-update claim for payment:", error);
                    }
                }
                return savedPayment;
            }
        }
        let receiptNumber = dto.receiptNumber;
        if (!receiptNumber || receiptNumber.trim() === "") {
            let attempts = 0;
            let isUnique = false;
            while (!isUnique && attempts < 10) {
                receiptNumber = await this.generateReceiptNumber();
                const existing = await this.srPaymentModel
                    .findOne({ receiptNumber })
                    .exec();
                if (!existing) {
                    isUnique = true;
                }
                else {
                    attempts++;
                    const match = receiptNumber.match(/PAY-(\d+)/);
                    if (match) {
                        const lastNumber = parseInt(match[1] || "0");
                        const nextNumber = (lastNumber + attempts)
                            .toString()
                            .padStart(3, "0");
                        receiptNumber = `PAY-${nextNumber}`;
                    }
                }
            }
            if (!isUnique) {
                receiptNumber = `PAY-${Date.now()}`;
            }
        }
        else {
            const existing = await this.srPaymentModel
                .findOne({ receiptNumber })
                .exec();
            if (existing) {
                throw new common_1.ConflictException("Receipt number already exists");
            }
        }
        let totalExpected = 0;
        let totalReceived = 0;
        let totalDiscount = 0;
        const items = dto.items.map((item) => {
            const expected = item.quantity * item.tradePrice;
            const received = item.quantity * item.tradePrice;
            const discount = expected - received;
            totalExpected += expected;
            totalReceived += received;
            totalDiscount += discount;
            return Object.assign(Object.assign({}, item), { discount });
        });
        const payment = new this.srPaymentModel({
            receiptNumber: receiptNumber,
            srId: dto.srId,
            issueId: dto.issueId,
            items,
            totalExpected,
            totalReceived,
            totalDiscount,
            paymentMethod: dto.paymentMethod,
            paymentDate: new Date(),
            receivedAmount: dto.receivedAmount || 0,
            companyClaim: dto.companyClaim || 0,
            customerInfo: dto.customerInfo,
            customerDue: dto.customerDue || 0,
            notes: dto.notes,
        });
        const savedPayment = await payment.save();
        if (savedPayment.companyClaim && savedPayment.companyClaim > 0) {
            try {
                await this.createClaimFromPayment(savedPayment);
            }
            catch (error) {
                console.error("Failed to auto-create claim for payment:", error);
            }
        }
        return savedPayment;
    }
    async findAll() {
        const { payments } = await this.getOptimized();
        return payments;
    }
    async getOptimized(companyId) {
        var _a;
        const [payments, issues, products, salesReps, returns, claims, companies] = await Promise.all([
            this.srPaymentModel
                .find()
                .populate("srId")
                .populate("issueId")
                .populate("items.productId")
                .sort({ paymentDate: -1, createdAt: -1 })
                .exec(),
            this.srIssueModel
                .find()
                .populate("srId")
                .populate("items.productId")
                .exec(),
            this.productModel.find().populate("companyId").exec(),
            this.salesRepModel.find().populate("companyId").exec(),
            this.productReturnModel
                .find()
                .populate("srId")
                .populate("issueId")
                .populate("items.productId")
                .exec(),
            this.companyClaimModel
                .find()
                .populate("companyId")
                .populate("issueId")
                .populate("paymentId")
                .exec(),
            this.companyModel.find().exec(),
        ]);
        let filteredProducts = products;
        let filteredSalesReps = salesReps;
        let filteredIssues = issues;
        let filteredPayments = payments;
        let filteredReturns = returns;
        let filteredClaims = claims;
        console.log("[SRPaymentsService] getOptimized - filteredClaims BEFORE issueClaimMap population:", filteredClaims);
        const getCompanyIdString = (obj) => {
            if (!obj || !obj.companyId)
                return undefined;
            return typeof obj.companyId === "string"
                ? obj.companyId
                : String(obj.companyId._id);
        };
        if (companyId) {
            filteredProducts = products.filter((p) => getCompanyIdString(p) === companyId);
            filteredSalesReps = salesReps.filter((sr) => getCompanyIdString(sr) === companyId);
            const companyProductIds = filteredProducts.map((p) => String(p._id));
            filteredIssues = issues.filter((issue) => issue.items.some((item) => {
                var _a;
                return companyProductIds.includes(String(((_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) || item.productId));
            }));
            const filteredIssueIds = filteredIssues.map((issue) => String(issue._id));
            filteredPayments = payments.filter((payment) => {
                var _a;
                return filteredIssueIds.includes(String(((_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) || payment.issueId));
            });
            filteredReturns = returns.filter((ret) => {
                var _a;
                return filteredIssueIds.includes(String(((_a = ret.issueId) === null || _a === void 0 ? void 0 : _a._id) || ret.issueId));
            });
            filteredClaims = claims.filter((claim) => getCompanyIdString(claim) === companyId);
        }
        const dueAmounts = {};
        const issueReceivedMap = {};
        filteredPayments.forEach((payment) => {
            var _a;
            const issueId = typeof payment.issueId === "string"
                ? payment.issueId
                : String(((_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) || payment.issueId);
            issueReceivedMap[issueId] =
                (issueReceivedMap[issueId] || 0) + (payment.receivedAmount || 0);
        });
        const issueReturnMap = {};
        filteredReturns.forEach((returnDoc) => {
            var _a;
            const issueId = typeof returnDoc.issueId === "string"
                ? returnDoc.issueId
                : String(((_a = returnDoc.issueId) === null || _a === void 0 ? void 0 : _a._id) || returnDoc.issueId);
            let totalReturnValue = 0;
            returnDoc.items.forEach((returnItem) => {
                const product = filteredProducts.find((p) => String(p._id) === String(returnItem.productId));
                if (product) {
                    totalReturnValue += returnItem.quantity * product.tradePrice;
                }
            });
            issueReturnMap[issueId] =
                (issueReturnMap[issueId] || 0) + totalReturnValue;
        });
        const issueClaimMap = {};
        filteredPayments.forEach((payment) => {
            var _a;
            const issueId = typeof payment.issueId === "string"
                ? payment.issueId
                : String(((_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) || payment.issueId);
            issueClaimMap[issueId] =
                (issueClaimMap[issueId] || 0) + (payment.companyClaim || 0);
        });
        for (const issue of filteredIssues) {
            const issueIdString = String(issue._id);
            let adjustedTotalAmount = issue.totalAmount || 0;
            adjustedTotalAmount = Math.max(0, adjustedTotalAmount - (issueReturnMap[issueIdString] || 0));
            const receivedAmount = issueReceivedMap[issueIdString] || 0;
            const due = Math.max(0, adjustedTotalAmount - receivedAmount);
            dueAmounts[issueIdString] = {
                totalAmount: adjustedTotalAmount,
                receivedAmount,
                due,
            };
        }
        for (const payment of filteredPayments) {
            if (payment.issueId) {
                const issueIdString = typeof payment.issueId === "string"
                    ? payment.issueId
                    : String(((_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) || payment.issueId);
                const calculatedDue = dueAmounts[issueIdString];
                if (calculatedDue) {
                    payment.calculatedTotalAmount = calculatedDue.totalAmount;
                    payment.calculatedReceivedAmount =
                        calculatedDue.receivedAmount;
                    payment.calculatedDue = calculatedDue.due;
                    payment.customerDue = payment.customerDue || 0;
                }
                else {
                    payment.calculatedTotalAmount = payment.totalExpected || 0;
                    payment.calculatedReceivedAmount =
                        payment.receivedAmount || 0;
                    payment.calculatedDue = Math.max(0, (payment.totalExpected || 0) - (payment.receivedAmount || 0));
                }
            }
            else {
                payment.calculatedTotalAmount = payment.totalExpected || 0;
                payment.calculatedReceivedAmount = payment.receivedAmount || 0;
                payment.calculatedDue = Math.max(0, (payment.totalExpected || 0) - (payment.receivedAmount || 0));
            }
        }
        filteredPayments.sort((a, b) => {
            const dateA = new Date(a.paymentDate || a.createdAt).getTime();
            const dateB = new Date(b.paymentDate || b.createdAt).getTime();
            return dateB - dateA;
        });
        console.log("[SRPaymentsService] getOptimized - Final filteredPayments before return:", filteredPayments);
        console.log("[SRPaymentsService] getOptimized - Final dueAmounts:", dueAmounts);
        return {
            payments: filteredPayments,
            issues: filteredIssues,
            products: filteredProducts,
            salesReps: filteredSalesReps,
            returns: filteredReturns,
            claims: filteredClaims,
            companies: companies.filter((c) => !companyId || String(c._id) === companyId),
            dueAmounts,
        };
    }
    async findOne(id) {
        var _a;
        const payment = await this.srPaymentModel
            .findById(id)
            .populate("srId")
            .populate("issueId", "issueNumber totalAmount")
            .populate("items.productId")
            .exec();
        if (!payment) {
            throw new common_1.NotFoundException("SR Payment not found");
        }
        const paymentObj = payment.toObject();
        if (payment.issueId) {
            const issueIdString = typeof payment.issueId === "string"
                ? payment.issueId
                : String(((_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) || payment.issueId);
            const issue = await this.srIssueModel.findById(issueIdString).exec();
            if (!issue) {
                paymentObj.totalAmount = payment.totalExpected || 0;
                paymentObj.receivedAmount =
                    payment.receivedAmount || payment.totalReceived || 0;
                paymentObj.due = Math.max(0, (payment.totalExpected || 0) - (payment.receivedAmount || 0));
                return paymentObj;
            }
            const paymentsForIssue = await this.srPaymentModel
                .find({ issueId: issueIdString })
                .exec();
            const totalReceivedAmountForIssue = paymentsForIssue.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);
            const returnsForIssue = await this.productReturnModel
                .find({ issueId: issueIdString })
                .populate("items.productId")
                .exec();
            let adjustedTotalAmount = 0;
            for (const issueItem of issue.items) {
                adjustedTotalAmount += issueItem.quantity * issueItem.tradePrice;
            }
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
            const claimsForIssue = await this.companyClaimModel
                .find({ issueId: issueIdString })
                .exec();
            const totalCompanyClaimForIssue = claimsForIssue.reduce((sum, claim) => sum + (claim.totalCompanyClaim || 0), 0);
            adjustedTotalAmount = Math.max(0, adjustedTotalAmount - totalCompanyClaimForIssue);
            paymentObj.totalAmount = adjustedTotalAmount;
            paymentObj.totalReceivedAmount = totalReceivedAmountForIssue;
            paymentObj.receivedAmount =
                payment.receivedAmount || payment.totalReceived || 0;
            paymentObj.due = Math.max(0, adjustedTotalAmount - totalReceivedAmountForIssue);
        }
        else {
            paymentObj.totalAmount = payment.totalExpected || 0;
            paymentObj.receivedAmount =
                payment.receivedAmount || payment.totalReceived || 0;
            paymentObj.due = Math.max(0, (payment.totalExpected || 0) - paymentObj.receivedAmount);
        }
        return paymentObj;
    }
    async findBySR(srId) {
        const { payments } = await this.getOptimized();
        return payments.filter((p) => {
            var _a;
            const pSrId = typeof p.srId === "string"
                ? p.srId
                : String(((_a = p.srId) === null || _a === void 0 ? void 0 : _a._id) || p.srId);
            return pSrId === srId;
        });
    }
    async update(id, dto) {
        if (dto.receiptNumber === null ||
            (dto.receiptNumber !== undefined && dto.receiptNumber.trim() === "")) {
            dto.receiptNumber = undefined;
        }
        const payment = await this.srPaymentModel.findById(id).exec();
        if (!payment) {
            throw new common_1.NotFoundException("SR Payment not found");
        }
        if (dto.items && dto.items.length > 0) {
            let totalExpected = 0;
            let totalReceived = 0;
            let totalDiscount = 0;
            const items = dto.items.map((item) => {
                var _a;
                const expected = item.quantity * item.tradePrice;
                const received = item.quantity * item.tradePrice;
                const discount = expected - received;
                totalExpected += expected;
                totalReceived += received;
                totalDiscount += discount;
                return {
                    productId: typeof item.productId === "string"
                        ? item.productId
                        : (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id,
                    quantity: item.quantity,
                    dealerPrice: item.dealerPrice,
                    tradePrice: item.tradePrice,
                    discount,
                };
            });
            const updateData = Object.assign(Object.assign({}, dto), { items,
                totalExpected, totalReceived: (payment.totalReceived || 0) + (dto.receivedAmount || 0), totalDiscount, receivedAmount: (payment.receivedAmount || 0) + (dto.receivedAmount || 0) });
            if (dto.receiptNumber && dto.receiptNumber.trim() !== "") {
                updateData.receiptNumber = dto.receiptNumber;
            }
            else if (!payment.receiptNumber &&
                (!dto.receiptNumber || dto.receiptNumber.trim() === "")) {
                updateData.receiptNumber = await this.generateReceiptNumber();
            }
            else if (dto.receiptNumber === undefined) {
                delete updateData.receiptNumber;
            }
            else if (dto.receiptNumber.trim() === "") {
                delete updateData.receiptNumber;
            }
            if (dto.companyClaim !== undefined) {
                updateData.companyClaim = dto.companyClaim;
            }
            if (dto.customerInfo !== undefined) {
                updateData.customerInfo = dto.customerInfo;
            }
            if (dto.customerDue !== undefined) {
                updateData.customerDue = dto.customerDue;
            }
            if (dto.notes) {
                updateData.notes = payment.notes
                    ? `${payment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
                    : dto.notes;
            }
            const updated = await this.srPaymentModel
                .findByIdAndUpdate(id, { $set: updateData }, { new: true })
                .populate("srId", "name phone")
                .populate("issueId", "issueNumber")
                .populate("items.productId", "name sku")
                .exec();
            if (updated.companyClaim && updated.companyClaim > 0) {
                try {
                    await this.updateClaimFromPayment(updated);
                }
                catch (error) {
                    console.error("Failed to auto-update claim for payment:", error);
                }
            }
            return updated;
        }
        else {
            const updated = await this.srPaymentModel
                .findByIdAndUpdate(id, { $set: dto }, { new: true })
                .populate("srId", "name phone")
                .populate("issueId", "issueNumber")
                .populate("items.productId", "name sku")
                .exec();
            return updated;
        }
    }
    async remove(id) {
        const claim = await this.companyClaimModel
            .findOne({ paymentId: id })
            .exec();
        if (claim) {
            await this.companyClaimModel.findByIdAndDelete(claim._id).exec();
        }
        const res = await this.srPaymentModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("SR Payment not found");
        }
    }
};
exports.SRPaymentsService = SRPaymentsService;
exports.SRPaymentsService = SRPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(1, (0, mongoose_1.InjectModel)(salesrep_schema_1.SalesRep.name)),
    __param(2, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(3, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(4, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(5, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(6, (0, mongoose_1.InjectModel)(product_return_schema_1.ProductReturn.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SRPaymentsService);
//# sourceMappingURL=sr-payments.service.js.map