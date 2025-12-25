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
exports.SRIssuesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
let SRIssuesService = class SRIssuesService {
    constructor(srIssueModel, productModel, salesRepModel) {
        this.srIssueModel = srIssueModel;
        this.productModel = productModel;
        this.salesRepModel = salesRepModel;
    }
    async generateIssueNumber() {
        const lastIssue = await this.srIssueModel
            .findOne()
            .sort({ createdAt: -1 })
            .exec();
        if (!lastIssue || !lastIssue.issueNumber) {
            return 'ISSUE-001';
        }
        const match = lastIssue.issueNumber.match(/ISSUE-(\d+)/);
        if (!match) {
            return 'ISSUE-001';
        }
        const lastNumber = parseInt(match[1] || '0');
        const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
        return `ISSUE-${nextNumber}`;
    }
    async create(dto) {
        let issueNumber = dto.issueNumber;
        if (!issueNumber) {
            issueNumber = await this.generateIssueNumber();
        }
        const existing = await this.srIssueModel.findOne({ issueNumber }).exec();
        if (existing) {
            throw new common_1.ConflictException('Issue number already exists');
        }
        const sr = await this.salesRepModel.findById(dto.srId).exec();
        if (!sr) {
            throw new common_1.NotFoundException('Sales Rep not found');
        }
        const productQuantities = new Map();
        const productMap = new Map();
        for (const item of dto.items) {
            const product = await this.productModel.findById(item.productId).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            }
            const currentQty = productQuantities.get(item.productId) || 0;
            productQuantities.set(item.productId, currentQty + item.quantity);
            productMap.set(item.productId, product);
        }
        for (const [productId, totalQuantity] of productQuantities.entries()) {
            const product = productMap.get(productId);
            if (!product) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            if (product.stock < totalQuantity) {
                throw new common_1.ConflictException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${totalQuantity}`);
            }
        }
        let totalAmount = 0;
        for (const item of dto.items) {
            totalAmount += item.quantity * item.dealerPrice;
        }
        const issue = new this.srIssueModel(Object.assign(Object.assign({}, dto), { issueNumber,
            totalAmount, issueDate: new Date() }));
        for (const item of dto.items) {
            await this.productModel.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity },
            }).exec();
        }
        return issue.save();
    }
    async findAll() {
        return this.srIssueModel
            .find()
            .populate('srId', 'name phone')
            .populate('items.productId', 'name sku')
            .sort({ issueDate: -1 })
            .exec();
    }
    async findOne(id) {
        const issue = await this.srIssueModel
            .findById(id)
            .populate('srId')
            .populate('items.productId')
            .exec();
        if (!issue) {
            throw new common_1.NotFoundException('SR Issue not found');
        }
        return issue;
    }
    async findBySR(srId) {
        return this.srIssueModel
            .find({ srId })
            .populate('items.productId', 'name sku')
            .sort({ issueDate: -1 })
            .exec();
    }
};
exports.SRIssuesService = SRIssuesService;
exports.SRIssuesService = SRIssuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(salesrep_schema_1.SalesRep.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SRIssuesService);
//# sourceMappingURL=sr-issues.service.js.map