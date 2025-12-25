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
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let SRPaymentsService = class SRPaymentsService {
    constructor(srPaymentModel, salesRepModel, srIssueModel, productModel, companyModel, companyClaimModel) {
        this.srPaymentModel = srPaymentModel;
        this.salesRepModel = salesRepModel;
        this.srIssueModel = srIssueModel;
        this.productModel = productModel;
        this.companyModel = companyModel;
        this.companyClaimModel = companyClaimModel;
    }
    async generateReceiptNumber() {
        const lastPayment = await this.srPaymentModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastPayment || !lastPayment.receiptNumber) {
            return 'PAY-001';
        }
        const match = lastPayment.receiptNumber.match(/PAY-(\d+)/);
        if (!match) {
            return 'PAY-001';
        }
        const lastNumber = parseInt(match[1] || '0');
        const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
        return `PAY-${nextNumber}`;
    }
    async generateClaimNumber() {
        const lastClaim = await this.companyClaimModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastClaim || !lastClaim.claimNumber) {
            return 'CLAIM-001';
        }
        const match = lastClaim.claimNumber.match(/CLAIM-(\d+)/);
        if (!match) {
            return 'CLAIM-001';
        }
        const lastNumber = parseInt(match[1] || '0');
        const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
        return `CLAIM-${nextNumber}`;
    }
    async createClaimFromPayment(payment) {
        var _a, _b, _c, _d;
        if (!payment.issueId) {
            throw new common_1.NotFoundException('Issue ID is required to create a claim');
        }
        let paymentIssueId;
        if (typeof payment.issueId === 'string') {
            paymentIssueId = mongoose_2.Types.ObjectId.isValid(payment.issueId)
                ? new mongoose_2.Types.ObjectId(payment.issueId)
                : payment.issueId;
        }
        else if (payment.issueId && typeof payment.issueId === 'object' && '_id' in payment.issueId) {
            paymentIssueId = payment.issueId._id;
        }
        else {
            paymentIssueId = payment.issueId;
        }
        const existingClaimByIssue = await this.companyClaimModel.findOne({
            $or: [
                { issueId: paymentIssueId },
                { issueId: String(paymentIssueId) },
                { issueId: new mongoose_2.Types.ObjectId(String(paymentIssueId)) }
            ]
        }).exec();
        if (existingClaimByIssue) {
            return this.updateClaimFromPayment(payment);
        }
        const paymentIdString = String(payment._id);
        const existingClaimByPayment = await this.companyClaimModel.findOne({
            $or: [
                { paymentId: paymentIdString },
                { paymentId: payment._id }
            ]
        }).exec();
        if (existingClaimByPayment) {
            return this.updateClaimFromPayment(payment);
        }
        const productIds = payment.items.map(item => {
            if (typeof item.productId === 'string') {
                return item.productId;
            }
            else if (item.productId && typeof item.productId === 'object' && '_id' in item.productId) {
                return item.productId._id;
            }
            throw new common_1.NotFoundException('Invalid product ID in payment items');
        });
        const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
        if (products.length === 0) {
            throw new common_1.NotFoundException('Products not found');
        }
        const companyId = typeof products[0].companyId === 'string'
            ? products[0].companyId
            : ((_a = products[0].companyId) === null || _a === void 0 ? void 0 : _a._id) || products[0].companyId;
        const company = await this.companyModel.findById(companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const claimItems = payment.items.map(paymentItem => {
            var _a;
            const productId = typeof paymentItem.productId === 'string'
                ? paymentItem.productId
                : ((_a = paymentItem.productId) === null || _a === void 0 ? void 0 : _a._id) || paymentItem.productId;
            const product = products.find(p => p._id.toString() === productId.toString());
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
            const commissionAmount = dealerPriceTotal * (company.commissionRate / 100);
            const srPayment = paymentItem.quantity * paymentItem.tradePrice;
            const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;
            return {
                productId,
                quantity: paymentItem.quantity,
                dealerPrice: paymentItem.dealerPrice,
                commissionRate: company.commissionRate,
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
        const claimNumber = await this.generateClaimNumber();
        const claimIssueId = typeof payment.issueId === 'string'
            ? payment.issueId
            : ((_c = (_b = payment.issueId) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || ((_d = payment.issueId) === null || _d === void 0 ? void 0 : _d._id);
        const claim = new this.companyClaimModel({
            claimNumber,
            companyId,
            paymentId: payment._id,
            issueId: claimIssueId,
            items: claimItems,
            totalDealerPrice,
            totalCommission,
            totalClaim,
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
            throw new common_1.NotFoundException('Issue ID is required to update a claim');
        }
        let updateIssueId;
        if (typeof payment.issueId === 'string') {
            updateIssueId = mongoose_2.Types.ObjectId.isValid(payment.issueId)
                ? new mongoose_2.Types.ObjectId(payment.issueId)
                : payment.issueId;
        }
        else if (payment.issueId && typeof payment.issueId === 'object' && '_id' in payment.issueId) {
            updateIssueId = payment.issueId._id;
        }
        else {
            updateIssueId = payment.issueId;
        }
        let existingClaim = await this.companyClaimModel.findOne({
            $or: [
                { issueId: updateIssueId },
                { issueId: String(updateIssueId) },
                { issueId: new mongoose_2.Types.ObjectId(String(updateIssueId)) }
            ]
        }).exec();
        if (!existingClaim) {
            const paymentIdString = String(payment._id);
            existingClaim = await this.companyClaimModel.findOne({
                $or: [
                    { paymentId: paymentIdString },
                    { paymentId: payment._id }
                ]
            }).exec();
        }
        if (!existingClaim) {
            return this.createClaimFromPayment(payment);
        }
        const productIds = payment.items.map(item => {
            if (typeof item.productId === 'string') {
                return item.productId;
            }
            else if (item.productId && typeof item.productId === 'object' && '_id' in item.productId) {
                return item.productId._id;
            }
            throw new common_1.NotFoundException('Invalid product ID in payment items');
        });
        const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
        if (products.length === 0) {
            throw new common_1.NotFoundException('Products not found');
        }
        const companyId = typeof products[0].companyId === 'string'
            ? products[0].companyId
            : ((_a = products[0].companyId) === null || _a === void 0 ? void 0 : _a._id) || products[0].companyId;
        const company = await this.companyModel.findById(companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const claimItems = payment.items.map(paymentItem => {
            var _a;
            const productId = typeof paymentItem.productId === 'string'
                ? paymentItem.productId
                : ((_a = paymentItem.productId) === null || _a === void 0 ? void 0 : _a._id) || paymentItem.productId;
            const product = products.find(p => p._id.toString() === productId.toString());
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
            const commissionAmount = dealerPriceTotal * (company.commissionRate / 100);
            const srPayment = paymentItem.quantity * paymentItem.tradePrice;
            const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;
            return {
                productId,
                quantity: paymentItem.quantity,
                dealerPrice: paymentItem.dealerPrice,
                commissionRate: company.commissionRate,
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
        const finalIssueId = typeof payment.issueId === 'string'
            ? payment.issueId
            : String(((_b = payment.issueId) === null || _b === void 0 ? void 0 : _b._id) || payment.issueId);
        existingClaim.items = claimItems;
        existingClaim.totalDealerPrice = totalDealerPrice;
        existingClaim.totalCommission = totalCommission;
        existingClaim.totalClaim = totalClaim;
        existingClaim.totalSRPayment = totalSRPayment;
        existingClaim.netFromCompany = netFromCompany;
        existingClaim.paymentId = String(payment._id);
        existingClaim.issueId = finalIssueId;
        existingClaim.notes = `Auto-updated from payment ${payment.receiptNumber}`;
        return existingClaim.save();
    }
    async create(dto) {
        var _a, _b, _c, _d, _e;
        console.log('📥 CREATE PAYMENT - Received DTO:', JSON.stringify(dto, null, 2));
        console.log('📥 CREATE PAYMENT - Issue ID:', dto.issueId);
        console.log('📥 CREATE PAYMENT - SR ID:', dto.srId);
        console.log('📥 CREATE PAYMENT - Items count:', ((_a = dto.items) === null || _a === void 0 ? void 0 : _a.length) || 0);
        if (dto.items && dto.items.length > 0) {
            const totalExpected = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
            const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
            console.log('📥 CREATE PAYMENT - Calculated Total Expected:', totalExpected);
            console.log('📥 CREATE PAYMENT - Calculated Total Received:', totalReceived);
            console.log('📥 CREATE PAYMENT - Items details:', dto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                dealerPrice: item.dealerPrice,
                tradePrice: item.tradePrice,
                expected: item.quantity * item.dealerPrice,
                received: item.quantity * item.tradePrice
            })));
        }
        if (dto.issueId) {
            const issueIdString = typeof dto.issueId === 'string' ? dto.issueId : String(dto.issueId);
            const existingPayment = await this.srPaymentModel.findOne({
                issueId: issueIdString
            }).exec();
            if (existingPayment) {
                console.log('🔄 UPDATE EXISTING PAYMENT - Existing payment found:', {
                    receiptNumber: existingPayment.receiptNumber,
                    currentTotalReceived: existingPayment.totalReceived,
                    currentTotalExpected: existingPayment.totalExpected
                });
                let newPaymentAmount = 0;
                let totalExpected = 0;
                let totalDiscount = 0;
                const updatedItems = dto.items.map((item) => {
                    var _a;
                    const expected = item.quantity * item.dealerPrice;
                    const received = item.quantity * item.tradePrice;
                    const discount = expected - received;
                    totalExpected += expected;
                    newPaymentAmount += received;
                    totalDiscount += discount;
                    return {
                        productId: typeof item.productId === 'string'
                            ? item.productId
                            : (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id,
                        quantity: item.quantity,
                        dealerPrice: item.dealerPrice,
                        tradePrice: item.tradePrice,
                        discount,
                    };
                });
                const cumulativeTotalReceived = (existingPayment.totalReceived || 0) + newPaymentAmount;
                console.log('🔄 UPDATE EXISTING PAYMENT - Payment calculation:', {
                    previousTotalReceived: existingPayment.totalReceived,
                    newPaymentAmount,
                    cumulativeTotalReceived,
                    totalExpected,
                    totalDiscount
                });
                existingPayment.items = updatedItems;
                existingPayment.totalExpected = totalExpected;
                existingPayment.totalReceived = cumulativeTotalReceived;
                existingPayment.totalDiscount = totalDiscount;
                existingPayment.paymentMethod = dto.paymentMethod;
                existingPayment.paymentDate = new Date();
                if (dto.notes) {
                    existingPayment.notes = existingPayment.notes
                        ? `${existingPayment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
                        : dto.notes;
                }
                const savedPayment = await existingPayment.save();
                try {
                    await this.updateClaimFromPayment(savedPayment);
                }
                catch (error) {
                    console.error('Failed to auto-update claim for payment:', error);
                }
                return savedPayment;
            }
        }
        let receiptNumber = dto.receiptNumber;
        if (!receiptNumber) {
            let attempts = 0;
            let isUnique = false;
            while (!isUnique && attempts < 10) {
                receiptNumber = await this.generateReceiptNumber();
                const existing = await this.srPaymentModel.findOne({ receiptNumber }).exec();
                if (!existing) {
                    isUnique = true;
                }
                else {
                    attempts++;
                    const match = receiptNumber.match(/PAY-(\d+)/);
                    if (match) {
                        const lastNumber = parseInt(match[1] || '0');
                        const nextNumber = (lastNumber + attempts).toString().padStart(3, '0');
                        receiptNumber = `PAY-${nextNumber}`;
                    }
                }
            }
            if (!isUnique) {
                receiptNumber = `PAY-${Date.now()}`;
            }
        }
        else {
            const existing = await this.srPaymentModel.findOne({ receiptNumber }).exec();
            if (existing) {
                throw new common_1.ConflictException('Receipt number already exists');
            }
        }
        const sr = await this.salesRepModel.findById(dto.srId).exec();
        if (!sr) {
            throw new common_1.NotFoundException('Sales Rep not found');
        }
        if (dto.issueId) {
            const issue = await this.srIssueModel.findById(dto.issueId).exec();
            if (!issue) {
                throw new common_1.NotFoundException('Issue not found');
            }
            const issueSrId = typeof issue.srId === 'string' ? issue.srId : (_c = (_b = issue.srId) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString();
            if (issueSrId !== dto.srId) {
                throw new common_1.ConflictException('Issue does not belong to the selected Sales Rep');
            }
            const issueProductIds = issue.items.map(item => {
                var _a, _b;
                const productId = typeof item.productId === 'string' ? item.productId : (_b = (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                return productId;
            });
            for (const paymentItem of dto.items) {
                const productId = typeof paymentItem.productId === 'string' ? paymentItem.productId : (_e = (_d = paymentItem.productId) === null || _d === void 0 ? void 0 : _d._id) === null || _e === void 0 ? void 0 : _e.toString();
                if (!issueProductIds.includes(productId)) {
                    throw new common_1.ConflictException(`Product ${productId} is not part of issue ${dto.issueId}`);
                }
                const issueItem = issue.items.find(item => {
                    var _a, _b;
                    const itemProductId = typeof item.productId === 'string' ? item.productId : (_b = (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                    return itemProductId === productId;
                });
                if (issueItem && paymentItem.quantity > issueItem.quantity) {
                    throw new common_1.ConflictException(`Payment quantity (${paymentItem.quantity}) exceeds issue quantity (${issueItem.quantity}) for product ${productId}`);
                }
                const product = await this.productModel.findById(productId).exec();
                if (!product) {
                    throw new common_1.NotFoundException(`Product ${productId} not found`);
                }
            }
            const issueTotal = issue.totalAmount || 0;
            const paymentTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
            if (paymentTotal > issueTotal) {
                throw new common_1.ConflictException(`Payment amount (${paymentTotal}) exceeds issue total (${issueTotal})`);
            }
            const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
            if (totalReceived > paymentTotal) {
                throw new common_1.ConflictException(`Received amount (${totalReceived}) cannot exceed expected amount (${paymentTotal}). Overpayment is not allowed.`);
            }
        }
        console.log('✨ CREATE NEW PAYMENT - No existing payment found, creating new one');
        let totalExpected = 0;
        let totalReceived = 0;
        let totalDiscount = 0;
        const items = dto.items.map((item) => {
            const expected = item.quantity * item.dealerPrice;
            const received = item.quantity * item.tradePrice;
            const discount = expected - received;
            totalExpected += expected;
            totalReceived += received;
            totalDiscount += discount;
            return Object.assign(Object.assign({}, item), { discount });
        });
        const payment = new this.srPaymentModel({
            receiptNumber,
            srId: dto.srId,
            issueId: dto.issueId,
            items,
            totalExpected,
            totalReceived,
            totalDiscount,
            paymentMethod: dto.paymentMethod,
            paymentDate: new Date(),
            notes: dto.notes,
        });
        const savedPayment = await payment.save();
        console.log('✅ PAYMENT SAVED - Final payment:', {
            receiptNumber: savedPayment.receiptNumber,
            totalExpected: savedPayment.totalExpected,
            totalReceived: savedPayment.totalReceived,
            totalDiscount: savedPayment.totalDiscount,
            issueId: savedPayment.issueId
        });
        try {
            await this.createClaimFromPayment(savedPayment);
        }
        catch (error) {
            console.error('Failed to auto-create claim for payment:', error);
        }
        return savedPayment;
    }
    async findAll() {
        const payments = await this.srPaymentModel
            .find()
            .populate('srId', 'name phone')
            .populate('issueId', 'issueNumber totalAmount')
            .populate('items.productId', 'name sku')
            .sort({ paymentDate: -1 })
            .exec();
        return Promise.all(payments.map(async (payment) => {
            var _a, _b;
            const paymentObj = payment.toObject();
            if (payment.issueId) {
                const issueIdString = typeof payment.issueId === 'string'
                    ? payment.issueId
                    : ((_b = (_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || String(payment.issueId);
                try {
                    const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
                    paymentObj.totalAmount = totalAmount;
                    paymentObj.receivedAmount = receivedAmount;
                    paymentObj.due = due;
                }
                catch (error) {
                    const issue = payment.issueId;
                    const totalAmount = (issue === null || issue === void 0 ? void 0 : issue.totalAmount) || payment.totalExpected || 0;
                    const receivedAmount = payment.totalReceived || 0;
                    paymentObj.totalAmount = totalAmount;
                    paymentObj.receivedAmount = receivedAmount;
                    paymentObj.due = Math.max(0, totalAmount - receivedAmount);
                }
            }
            else {
                paymentObj.totalAmount = payment.totalExpected || 0;
                paymentObj.receivedAmount = payment.totalReceived || 0;
                paymentObj.due = Math.max(0, (payment.totalExpected || 0) - (payment.totalReceived || 0));
            }
            return paymentObj;
        }));
    }
    async calculateDueAmount(issueId) {
        const issue = await this.srIssueModel.findById(issueId).exec();
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        const issueIdString = typeof issueId === 'string' ? issueId : String(issueId);
        const payment = await this.srPaymentModel.findOne({ issueId: issueIdString }).exec();
        const totalAmount = issue.totalAmount || 0;
        const receivedAmount = payment ? (payment.totalReceived || 0) : 0;
        const due = Math.max(0, totalAmount - receivedAmount);
        return { totalAmount, receivedAmount, due };
    }
    async findOne(id) {
        var _a, _b;
        const payment = await this.srPaymentModel
            .findById(id)
            .populate('srId')
            .populate('issueId', 'issueNumber totalAmount')
            .populate('items.productId')
            .exec();
        if (!payment) {
            throw new common_1.NotFoundException('SR Payment not found');
        }
        const paymentObj = payment.toObject();
        if (payment.issueId) {
            const issueIdString = typeof payment.issueId === 'string'
                ? payment.issueId
                : ((_b = (_a = payment.issueId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || String(payment.issueId);
            try {
                const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
                paymentObj.totalAmount = totalAmount;
                paymentObj.receivedAmount = receivedAmount;
                paymentObj.due = due;
            }
            catch (error) {
                const issue = payment.issueId;
                const totalAmount = (issue === null || issue === void 0 ? void 0 : issue.totalAmount) || payment.totalExpected || 0;
                const receivedAmount = payment.totalReceived || 0;
                paymentObj.totalAmount = totalAmount;
                paymentObj.receivedAmount = receivedAmount;
                paymentObj.due = Math.max(0, totalAmount - receivedAmount);
            }
        }
        else {
            paymentObj.totalAmount = payment.totalExpected || 0;
            paymentObj.receivedAmount = payment.totalReceived || 0;
            paymentObj.due = Math.max(0, (payment.totalExpected || 0) - (payment.totalReceived || 0));
        }
        return paymentObj;
    }
    async findBySR(srId) {
        return this.srPaymentModel
            .find({ srId })
            .populate('items.productId', 'name sku')
            .sort({ paymentDate: -1 })
            .exec();
    }
    async update(id, dto) {
        var _a, _b, _c, _d;
        console.log('📝 UPDATE PAYMENT - Payment ID:', id);
        console.log('📝 UPDATE PAYMENT - Received DTO:', JSON.stringify(dto, null, 2));
        const payment = await this.srPaymentModel.findById(id).exec();
        if (!payment) {
            throw new common_1.NotFoundException('SR Payment not found');
        }
        console.log('📝 UPDATE PAYMENT - Current payment:', {
            receiptNumber: payment.receiptNumber,
            currentTotalReceived: payment.totalReceived,
            currentTotalExpected: payment.totalExpected,
            issueId: payment.issueId
        });
        if (payment.issueId) {
            const issueIdString = typeof payment.issueId === 'string' ? payment.issueId : String(payment.issueId);
            const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
            console.log('📝 UPDATE PAYMENT - Due calculation:', { totalAmount, receivedAmount, due });
            if (due === 0) {
                console.log('❌ UPDATE PAYMENT - Blocked: Payment is fully paid (due = 0)');
                throw new common_1.ConflictException('Cannot edit payment: Issue is fully paid (due = 0)');
            }
            if (dto.items && dto.items.length > 0) {
                const newTotalReceived = dto.items.reduce((sum, item) => {
                    return sum + (item.quantity * item.tradePrice);
                }, 0);
                const maxAllowedReceived = totalAmount;
                if (newTotalReceived > maxAllowedReceived) {
                    console.log('❌ UPDATE PAYMENT - Blocked: New received amount exceeds issue total');
                    throw new common_1.ConflictException(`Cannot update payment: Received amount (${newTotalReceived}) exceeds issue total (${totalAmount}). Maximum allowed: ${totalAmount}`);
                }
                const currentReceived = receivedAmount;
                const maxAllowedForEdit = currentReceived + due;
                if (newTotalReceived > maxAllowedForEdit) {
                    console.log('❌ UPDATE PAYMENT - Blocked: New received amount exceeds due amount');
                    throw new common_1.ConflictException(`Cannot update payment: Received amount (${newTotalReceived}) cannot exceed ${maxAllowedForEdit}. Current received: ${currentReceived}, Due: ${due}`);
                }
            }
        }
        if (dto.items && dto.items.length > 0) {
            const issueId = dto.issueId || payment.issueId;
            if (issueId) {
                const issueIdString = typeof issueId === 'string' ? issueId : String(issueId);
                const issue = await this.srIssueModel.findById(issueIdString).exec();
                if (!issue) {
                    throw new common_1.NotFoundException('Issue not found');
                }
                const srId = dto.srId || payment.srId;
                const srIdString = typeof srId === 'string' ? srId : String(srId);
                const issueSrId = typeof issue.srId === 'string' ? issue.srId : (_b = (_a = issue.srId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (issueSrId !== srIdString) {
                    throw new common_1.ConflictException('Issue does not belong to the selected Sales Rep');
                }
                const issueProductIds = issue.items.map(item => {
                    var _a, _b;
                    const productId = typeof item.productId === 'string' ? item.productId : (_b = (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                    return productId;
                });
                for (const paymentItem of dto.items) {
                    const productId = typeof paymentItem.productId === 'string' ? paymentItem.productId : (_d = (_c = paymentItem.productId) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString();
                    if (!issueProductIds.includes(productId)) {
                        throw new common_1.ConflictException(`Product ${productId} is not part of issue ${issueIdString}`);
                    }
                    const issueItem = issue.items.find(item => {
                        var _a, _b;
                        const itemProductId = typeof item.productId === 'string' ? item.productId : (_b = (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                        return itemProductId === productId;
                    });
                    if (issueItem && paymentItem.quantity > issueItem.quantity) {
                        throw new common_1.ConflictException(`Payment quantity (${paymentItem.quantity}) exceeds issue quantity (${issueItem.quantity}) for product ${productId}`);
                    }
                    const product = await this.productModel.findById(productId).exec();
                    if (!product) {
                        throw new common_1.NotFoundException(`Product ${productId} not found`);
                    }
                }
                const issueTotal = issue.totalAmount || 0;
                const paymentTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
                if (paymentTotal > issueTotal) {
                    throw new common_1.ConflictException(`Payment amount (${paymentTotal}) exceeds issue total (${issueTotal})`);
                }
                const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
                if (totalReceived > paymentTotal) {
                    throw new common_1.ConflictException(`Received amount (${totalReceived}) cannot exceed expected amount (${paymentTotal}). Overpayment is not allowed.`);
                }
            }
            let totalExpected = 0;
            let totalReceived = 0;
            let totalDiscount = 0;
            const items = dto.items.map((item) => {
                const expected = item.quantity * item.dealerPrice;
                const received = item.quantity * item.tradePrice;
                const discount = expected - received;
                totalExpected += expected;
                totalReceived += received;
                totalDiscount += discount;
                return Object.assign(Object.assign({}, item), { discount });
            });
            const updateData = Object.assign(Object.assign({}, dto), { items,
                totalExpected,
                totalReceived,
                totalDiscount });
            console.log('📝 UPDATE PAYMENT - Update data:', {
                totalExpected,
                totalReceived,
                totalDiscount,
                itemsCount: items.length
            });
            const updated = await this.srPaymentModel
                .findByIdAndUpdate(id, { $set: updateData }, { new: true })
                .populate('srId', 'name phone')
                .populate('issueId', 'issueNumber')
                .populate('items.productId', 'name sku')
                .exec();
            console.log('✅ UPDATE PAYMENT - Payment updated:', {
                receiptNumber: updated.receiptNumber,
                newTotalReceived: updated.totalReceived,
                newTotalExpected: updated.totalExpected
            });
            try {
                await this.updateClaimFromPayment(updated);
            }
            catch (error) {
                console.error('Failed to auto-update claim for payment:', error);
            }
            return updated;
        }
        else {
            const updated = await this.srPaymentModel
                .findByIdAndUpdate(id, { $set: dto }, { new: true })
                .populate('srId', 'name phone')
                .populate('issueId', 'issueNumber')
                .populate('items.productId', 'name sku')
                .exec();
            return updated;
        }
    }
    async remove(id) {
        const claim = await this.companyClaimModel.findOne({ paymentId: id }).exec();
        if (claim) {
            await this.companyClaimModel.findByIdAndDelete(claim._id).exec();
        }
        const res = await this.srPaymentModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException('SR Payment not found');
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
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SRPaymentsService);
//# sourceMappingURL=sr-payments.service.js.map