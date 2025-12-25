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
let CompanyClaimsService = class CompanyClaimsService {
    constructor(companyClaimModel, companyModel) {
        this.companyClaimModel = companyClaimModel;
        this.companyModel = companyModel;
    }
    async create(dto) {
        const existing = await this.companyClaimModel.findOne({ claimNumber: dto.claimNumber }).exec();
        if (existing) {
            throw new common_1.ConflictException('Claim number already exists');
        }
        const company = await this.companyModel.findById(dto.companyId).exec();
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
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
        return claim.save();
    }
    async findAll() {
        return this.companyClaimModel
            .find()
            .populate('companyId', 'name code')
            .populate('paymentId', 'receiptNumber')
            .populate('items.productId', 'name sku')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        const claim = await this.companyClaimModel
            .findById(id)
            .populate('companyId')
            .populate('paymentId')
            .populate('items.productId')
            .exec();
        if (!claim) {
            throw new common_1.NotFoundException('Company Claim not found');
        }
        return claim;
    }
    async updateStatus(id, status, paidDate) {
        const updateData = { status };
        if (status === company_claim_schema_1.ClaimStatus.PAID && paidDate) {
            updateData.paidDate = paidDate;
        }
        const updated = await this.companyClaimModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Company Claim not found');
        }
        return updated;
    }
    async findByCompany(companyId) {
        return this.companyClaimModel
            .find({ companyId })
            .populate('items.productId', 'name sku')
            .sort({ createdAt: -1 })
            .exec();
    }
};
exports.CompanyClaimsService = CompanyClaimsService;
exports.CompanyClaimsService = CompanyClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CompanyClaimsService);
//# sourceMappingURL=company-claims.service.js.map