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
exports.SRPaymentSchema = exports.SRPayment = exports.SRPaymentItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
class SRPaymentItem {
}
exports.SRPaymentItem = SRPaymentItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Product', required: true }),
    __metadata("design:type", String)
], SRPaymentItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SRPaymentItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPaymentItem.prototype, "dealerPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPaymentItem.prototype, "tradePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPaymentItem.prototype, "discount", void 0);
let SRPayment = class SRPayment {
};
exports.SRPayment = SRPayment;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], SRPayment.prototype, "receiptNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'SalesRep', required: true }),
    __metadata("design:type", String)
], SRPayment.prototype, "srId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'SRIssue' }),
    __metadata("design:type", String)
], SRPayment.prototype, "issueId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [SRPaymentItem], _id: false, required: true }),
    __metadata("design:type", Array)
], SRPayment.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPayment.prototype, "totalExpected", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPayment.prototype, "totalReceived", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRPayment.prototype, "totalDiscount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], SRPayment.prototype, "paymentDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SRPayment.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SRPayment.prototype, "notes", void 0);
exports.SRPayment = SRPayment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SRPayment);
exports.SRPaymentSchema = mongoose_1.SchemaFactory.createForClass(SRPayment);
exports.SRPaymentSchema.index({ receiptNumber: 1 }, { unique: true });
exports.SRPaymentSchema.index({ srId: 1, paymentDate: -1 });
//# sourceMappingURL=sr-payment.schema.js.map