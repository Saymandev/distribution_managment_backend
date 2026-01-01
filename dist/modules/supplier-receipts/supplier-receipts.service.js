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
exports.SupplierReceiptsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../../database/schemas/company.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let SupplierReceiptsService = class SupplierReceiptsService {
    constructor(supplierReceiptModel, supplierPaymentModel, companyModel, productModel) {
        this.supplierReceiptModel = supplierReceiptModel;
        this.supplierPaymentModel = supplierPaymentModel;
        this.companyModel = companyModel;
        this.productModel = productModel;
    }
    async generateReceiptNumber() {
        const lastReceipt = await this.supplierReceiptModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastReceipt || !lastReceipt.receiptNumber) {
            return "SUP-RCP-001";
        }
        const match = lastReceipt.receiptNumber.match(/SUP-RCP-(\d+)/);
        if (!match) {
            return "SUP-RCP-001";
        }
        const lastNumber = parseInt(match[1] || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        return `SUP-RCP-${nextNumber}`;
    }
    async create(dto) {
        const company = await this.companyModel.findById(dto.companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        for (const item of dto.items) {
            const product = await this.productModel.findById(item.productId).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productName} not found`);
            }
            await this.productModel.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity },
            });
        }
        let receiptNumber = dto.receiptNumber;
        if (!receiptNumber) {
            let attempts = 0;
            let isUnique = false;
            while (!isUnique && attempts < 10) {
                receiptNumber = await this.generateReceiptNumber();
                const existing = await this.supplierReceiptModel
                    .findOne({ receiptNumber })
                    .exec();
                if (!existing) {
                    isUnique = true;
                }
                else {
                    attempts++;
                    const match = receiptNumber.match(/SUP-RCP-(\d+)/);
                    if (match) {
                        const lastNumber = parseInt(match[1] || "0");
                        const nextNumber = (lastNumber + attempts)
                            .toString()
                            .padStart(3, "0");
                        receiptNumber = `SUP-RCP-${nextNumber}`;
                    }
                }
            }
            if (!isUnique) {
                receiptNumber = `SUP-RCP-${Date.now()}`;
            }
        }
        else {
            const existing = await this.supplierReceiptModel
                .findOne({ receiptNumber })
                .exec();
            if (existing) {
                throw new common_1.NotFoundException("Receipt number already exists");
            }
        }
        const receipt = new this.supplierReceiptModel(Object.assign(Object.assign({}, dto), { receiptNumber, receiptDate: dto.receiptDate || new Date() }));
        return receipt.save();
    }
    async findAll() {
        const receiptsRaw = await this.supplierReceiptModel
            .find()
            .populate("companyId", "name code")
            .sort({ receiptDate: -1 })
            .exec();
        return receiptsRaw.map((receipt) => receipt.toObject());
    }
    async findOne(id) {
        const receipt = await this.supplierReceiptModel
            .findById(id)
            .populate("companyId", "name code")
            .exec();
        if (!receipt) {
            throw new common_1.NotFoundException("Supplier receipt not found");
        }
        return receipt.toObject();
    }
    async findByCompany(companyId) {
        const receiptsRaw = await this.supplierReceiptModel
            .find({ companyId })
            .populate("companyId", "name code")
            .sort({ receiptDate: -1 })
            .exec();
        return receiptsRaw.map((receipt) => receipt.toObject());
    }
    async update(id, dto) {
        if (dto.receiptNumber) {
            const existing = await this.supplierReceiptModel
                .findOne({ receiptNumber: dto.receiptNumber, _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.NotFoundException("Receipt number already exists");
            }
        }
        const updated = await this.supplierReceiptModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Supplier receipt not found");
        }
        return updated;
    }
    async remove(id) {
        const result = await this.supplierReceiptModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException("Supplier receipt not found");
        }
    }
    async getSupplierBalance(companyId) {
        console.log("🔍 getSupplierBalance called with companyId:", companyId);
        const matchCondition = companyId ? { companyId: companyId } : {};
        console.log("🔍 Balance match condition:", matchCondition);
        const supplierPayments = await this.supplierPaymentModel.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: "$companyId",
                    totalPaid: { $sum: "$amount" },
                    paymentCount: { $sum: 1 },
                },
            },
        ]);
        const allReceipts = await this.supplierReceiptModel.find(matchCondition);
        const receiptsMap = new Map();
        allReceipts.forEach((receipt) => {
            const companyId = receipt.companyId._id
                ? receipt.companyId._id.toString()
                : receipt.companyId.toString();
            const existing = receiptsMap.get(companyId) || {
                _id: receipt.companyId._id || receipt.companyId,
                totalReceived: 0,
                receiptCount: 0,
            };
            existing.totalReceived += receipt.totalValue;
            existing.receiptCount += 1;
            receiptsMap.set(companyId, existing);
        });
        const supplierReceipts = Array.from(receiptsMap.entries()).map(([_companyId, data]) => ({
            _id: data._id,
            totalReceived: data.totalReceived,
            receiptCount: data.receiptCount,
        }));
        console.log("🧾 Supplier receipts manual aggregation result:", supplierReceipts);
        const balanceMap = new Map();
        supplierPayments.forEach((payment) => {
            balanceMap.set(payment._id.toString(), {
                companyId: payment._id,
                totalPaid: payment.totalPaid,
                paymentCount: payment.paymentCount,
                totalReceived: 0,
                receiptCount: 0,
                balance: -payment.totalPaid,
            });
        });
        supplierReceipts.forEach((receipt) => {
            if (!receipt._id) {
                console.warn("⚠️ Skipping receipt with null companyId in balance calculation");
                return;
            }
            const companyId = receipt._id.toString();
            const existing = balanceMap.get(companyId) || {
                companyId: receipt._id,
                totalPaid: 0,
                paymentCount: 0,
                totalReceived: 0,
                receiptCount: 0,
                balance: 0,
            };
            existing.totalReceived += receipt.totalReceived;
            existing.receiptCount += receipt.receiptCount;
            existing.balance = existing.totalReceived - existing.totalPaid;
            balanceMap.set(companyId, existing);
        });
        balanceMap.forEach((value, _key) => {
            if (value.totalReceived === 0 && value.totalPaid > 0) {
                value.balance = -value.totalPaid;
            }
        });
        return Array.from(balanceMap.values());
    }
    async findAllWithFilters(filters) {
        const { companyId, startDate, endDate, search, page, limit } = filters;
        console.log("🔍 Backend: findAllWithFilters called with:", {
            companyId,
            startDate,
            endDate,
            search,
            page,
            limit,
        });
        const skip = (page - 1) * limit;
        console.log("🔍 Returning all receipts for frontend filtering");
        const receiptsRaw = await this.supplierReceiptModel
            .find({})
            .populate("companyId", "name code")
            .sort({ receiptDate: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        const total = await this.supplierReceiptModel.countDocuments({}).exec();
        console.log("📦 Receipts found:", receiptsRaw.length, "total count:", total);
        const receipts = receiptsRaw.map((receipt) => receipt.toObject());
        const result = {
            receipts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalReceiptsValue: receipts.reduce((sum, r) => sum + r.totalValue, 0),
            balance: 0,
        };
        console.log("📦 Backend: Returning supplier receipts data:", {
            receiptsCount: receipts.length,
            total,
        });
        return result;
    }
    async testBalance(companyId) {
        console.log("🔍 Service: Test balance called with companyId:", companyId);
        if (!companyId) {
            return { error: "companyId required" };
        }
        try {
            const companyObjectId = new mongoose_2.Types.ObjectId(companyId);
            const [totalPaid, totalReceived] = await Promise.all([
                this.supplierPaymentModel
                    .find({ companyId: companyObjectId })
                    .select("amount")
                    .then((docs) => {
                    const sum = docs.reduce((sum, doc) => sum + doc.amount, 0);
                    console.log("🔍 Test: Total Paid:", sum, "from", docs.length, "payments");
                    return sum;
                }),
                this.supplierReceiptModel
                    .find({ companyId: companyObjectId })
                    .select("totalValue")
                    .then((docs) => {
                    const sum = docs.reduce((sum, doc) => sum + doc.totalValue, 0);
                    console.log("🔍 Test: Total Received:", sum, "from", docs.length, "receipts");
                    return sum;
                }),
            ]);
            const balance = totalReceived - totalPaid;
            console.log("🔍 Test: Final balance:", balance);
            return {
                companyId,
                totalPaid,
                totalReceived,
                balance,
                message: "Test balance calculation completed",
            };
        }
        catch (error) {
            console.error("🔍 Test: Error:", error);
            return { error: error.message };
        }
    }
};
exports.SupplierReceiptsService = SupplierReceiptsService;
exports.SupplierReceiptsService = SupplierReceiptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SupplierReceipt.name)),
    __param(1, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SupplierPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(3, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SupplierReceiptsService);
//# sourceMappingURL=supplier-receipts.service.js.map