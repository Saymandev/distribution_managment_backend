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
exports.SupplierPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../../database/schemas/company.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let SupplierPaymentsService = class SupplierPaymentsService {
    constructor(supplierPaymentModel, companyModel) {
        this.supplierPaymentModel = supplierPaymentModel;
        this.companyModel = companyModel;
    }
    async generatePaymentNumber() {
        const lastPayment = await this.supplierPaymentModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastPayment || !lastPayment.paymentNumber) {
            return "SUP-PAY-001";
        }
        const match = lastPayment.paymentNumber.match(/SUP-PAY-(\d+)/);
        if (!match) {
            return "SUP-PAY-001";
        }
        const lastNumber = parseInt(match[1] || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        return `SUP-PAY-${nextNumber}`;
    }
    async create(dto) {
        const company = await this.companyModel.findById(dto.companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        let paymentNumber = dto.paymentNumber;
        if (!paymentNumber) {
            let attempts = 0;
            let isUnique = false;
            while (!isUnique && attempts < 10) {
                paymentNumber = await this.generatePaymentNumber();
                const existing = await this.supplierPaymentModel
                    .findOne({ paymentNumber })
                    .exec();
                if (!existing) {
                    isUnique = true;
                }
                else {
                    attempts++;
                    const match = paymentNumber.match(/SUP-PAY-(\d+)/);
                    if (match) {
                        const lastNumber = parseInt(match[1] || "0");
                        const nextNumber = (lastNumber + attempts)
                            .toString()
                            .padStart(3, "0");
                        paymentNumber = `SUP-PAY-${nextNumber}`;
                    }
                }
            }
            if (!isUnique) {
                paymentNumber = `SUP-PAY-${Date.now()}`;
            }
        }
        else {
            const existing = await this.supplierPaymentModel
                .findOne({ paymentNumber })
                .exec();
            if (existing) {
                throw new common_1.NotFoundException("Payment number already exists");
            }
        }
        const payment = new this.supplierPaymentModel(Object.assign(Object.assign({}, dto), { paymentNumber, paymentDate: dto.paymentDate || new Date() }));
        return payment.save();
    }
    async findAll() {
        return this.supplierPaymentModel
            .find()
            .populate("companyId", "name code")
            .sort({ paymentDate: -1 })
            .exec();
    }
    async findOne(id) {
        const payment = await this.supplierPaymentModel
            .findById(id)
            .populate("companyId")
            .exec();
        if (!payment) {
            throw new common_1.NotFoundException("Supplier payment not found");
        }
        return payment;
    }
    async findByCompany(companyId) {
        return this.supplierPaymentModel
            .find({ companyId })
            .populate("companyId", "name code")
            .sort({ paymentDate: -1 })
            .exec();
    }
    async update(id, dto) {
        if (dto.paymentNumber) {
            const existing = await this.supplierPaymentModel
                .findOne({ paymentNumber: dto.paymentNumber, _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.NotFoundException("Payment number already exists");
            }
        }
        const updated = await this.supplierPaymentModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Supplier payment not found");
        }
        return updated;
    }
    async remove(id) {
        const result = await this.supplierPaymentModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException("Supplier payment not found");
        }
    }
    async findAllWithFilters(filters) {
        const { companyId, startDate, endDate, search, page, limit } = filters;
        const matchConditions = {};
        if (companyId) {
            try {
                matchConditions.companyId = new mongoose_2.Types.ObjectId(companyId);
            }
            catch (error) {
                matchConditions.companyId = companyId;
            }
        }
        if (startDate || endDate) {
            matchConditions.paymentDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                matchConditions.paymentDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchConditions.paymentDate.$lte = end;
            }
        }
        if (search) {
            matchConditions.$or = [
                { paymentNumber: { $regex: search, $options: "i" } },
                { paymentMethod: { $regex: search, $options: "i" } },
                { reference: { $regex: search, $options: "i" } },
                { notes: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.supplierPaymentModel
                .find(matchConditions)
                .populate("companyId", "name code")
                .sort({ paymentDate: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.supplierPaymentModel.countDocuments(matchConditions).exec(),
        ]);
        return {
            payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.SupplierPaymentsService = SupplierPaymentsService;
exports.SupplierPaymentsService = SupplierPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SupplierPayment.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SupplierPaymentsService);
//# sourceMappingURL=supplier-payments.service.js.map