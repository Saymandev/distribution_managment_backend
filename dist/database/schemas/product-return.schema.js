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
exports.ProductReturnSchema = exports.ProductReturn = exports.ReturnItem = exports.ReturnStatus = exports.ReturnType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ReturnType;
(function (ReturnType) {
    ReturnType["CUSTOMER_RETURN"] = "customer_return";
    ReturnType["DAMAGE_RETURN"] = "damage_return";
})(ReturnType || (exports.ReturnType = ReturnType = {}));
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["PENDING"] = "pending";
    ReturnStatus["PROCESSED"] = "processed";
    ReturnStatus["RETURNED"] = "returned";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
class ReturnItem {
}
exports.ReturnItem = ReturnItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "Product", required: true }),
    __metadata("design:type", String)
], ReturnItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], ReturnItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ReturnItem.prototype, "reason", void 0);
let ProductReturn = class ProductReturn {
};
exports.ProductReturn = ProductReturn;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], ProductReturn.prototype, "returnNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ReturnType }),
    __metadata("design:type", String)
], ProductReturn.prototype, "returnType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "SalesRep" }),
    __metadata("design:type", String)
], ProductReturn.prototype, "srId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "Company" }),
    __metadata("design:type", String)
], ProductReturn.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "SRIssue" }),
    __metadata("design:type", String)
], ProductReturn.prototype, "issueId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ReturnItem], _id: false, required: true }),
    __metadata("design:type", Array)
], ProductReturn.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ReturnStatus, default: ReturnStatus.PENDING }),
    __metadata("design:type", String)
], ProductReturn.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], ProductReturn.prototype, "returnDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ProductReturn.prototype, "notes", void 0);
exports.ProductReturn = ProductReturn = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ProductReturn);
exports.ProductReturnSchema = mongoose_1.SchemaFactory.createForClass(ProductReturn);
exports.ProductReturnSchema.index({ returnType: 1, status: 1 });
//# sourceMappingURL=product-return.schema.js.map