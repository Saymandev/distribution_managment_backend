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
exports.SRIssueSchema = exports.SRIssue = exports.SRIssueItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
class SRIssueItem {
}
exports.SRIssueItem = SRIssueItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "Product", required: true }),
    __metadata("design:type", String)
], SRIssueItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SRIssueItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRIssueItem.prototype, "dealerPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRIssueItem.prototype, "tradePrice", void 0);
let SRIssue = class SRIssue {
};
exports.SRIssue = SRIssue;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], SRIssue.prototype, "issueNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "SalesRep", required: true }),
    __metadata("design:type", String)
], SRIssue.prototype, "srId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [SRIssueItem], _id: false, required: true }),
    __metadata("design:type", Array)
], SRIssue.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], SRIssue.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], SRIssue.prototype, "issueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SRIssue.prototype, "notes", void 0);
exports.SRIssue = SRIssue = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SRIssue);
exports.SRIssueSchema = mongoose_1.SchemaFactory.createForClass(SRIssue);
exports.SRIssueSchema.index({ srId: 1, issueDate: -1 });
//# sourceMappingURL=sr-issue.schema.js.map