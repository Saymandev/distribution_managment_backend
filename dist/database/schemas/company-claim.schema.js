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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyClaimSchema = exports.CompanyClaim = exports.ClaimItem = exports.ClaimStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["PENDING"] = "pending";
    ClaimStatus["CLAIMED"] = "claimed";
    ClaimStatus["PAID"] = "paid";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
class ClaimItem {
}
exports.ClaimItem = ClaimItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Product', required: true }),
    __metadata("design:type", String)
], ClaimItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "dealerPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "commissionRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "commissionAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "srPayment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], ClaimItem.prototype, "netFromCompany", void 0);
let CompanyClaim = class CompanyClaim {
};
exports.CompanyClaim = CompanyClaim;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], CompanyClaim.prototype, "claimNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Company', required: true }),
    __metadata("design:type", String)
], CompanyClaim.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'SRPayment' }),
    __metadata("design:type", String)
], CompanyClaim.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'SRIssue' }),
    __metadata("design:type", String)
], CompanyClaim.prototype, "issueId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ClaimItem], _id: false, required: true }),
    __metadata("design:type", Array)
], CompanyClaim.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], CompanyClaim.prototype, "totalDealerPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], CompanyClaim.prototype, "totalCommission", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], CompanyClaim.prototype, "totalClaim", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], CompanyClaim.prototype, "totalSRPayment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], CompanyClaim.prototype, "netFromCompany", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ClaimStatus, default: ClaimStatus.PENDING }),
    __metadata("design:type", String)
], CompanyClaim.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CompanyClaim.prototype, "paidDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CompanyClaim.prototype, "notes", void 0);
exports.CompanyClaim = CompanyClaim = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CompanyClaim);
exports.CompanyClaimSchema = mongoose_1.SchemaFactory.createForClass(CompanyClaim);
exports.CompanyClaimSchema.index({ claimNumber: 1 }, { unique: true });
exports.CompanyClaimSchema.index({ companyId: 1, status: 1 });
exports.CompanyClaimSchema.index({ issueId: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=company-claim.schema.js.map