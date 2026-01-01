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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_return_schema_1 = require("../../database/schemas/product-return.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
let ProductsService = class ProductsService {
    constructor(productModel, productReturnModel) {
        this.productModel = productModel;
        this.productReturnModel = productReturnModel;
    }
    async create(dto) {
        var _a, _b, _c, _d;
        const existing = await this.productModel.findOne({ sku: dto.sku }).exec();
        if (existing) {
            throw new common_1.ConflictException("Product with this SKU already exists");
        }
        const commissionPercent = (_a = dto.commissionPercent) !== null && _a !== void 0 ? _a : 0;
        const dealerPrice = dto.dealerPrice || 0;
        console.log("🔧 Backend received dealerPrice:", dealerPrice, "for product:", dto.name);
        const tradePrice = Number((dealerPrice + dealerPrice * (commissionPercent / 100)).toFixed(2));
        const created = new this.productModel(Object.assign(Object.assign({}, dto), { commissionPercent,
            tradePrice, stock: (_b = dto.stock) !== null && _b !== void 0 ? _b : 0, reorderLevel: (_c = dto.reorderLevel) !== null && _c !== void 0 ? _c : 0, isActive: (_d = dto.isActive) !== null && _d !== void 0 ? _d : true }));
        return created.save();
    }
    async findAll() {
        const products = await this.productModel
            .find()
            .populate("companyId", "name code")
            .sort({ name: 1 })
            .exec();
        const productIds = products.map((p) => p._id);
        const damageReturns = await this.productReturnModel
            .find({
            returnType: product_return_schema_1.ReturnType.DAMAGE_RETURN,
            status: { $in: [product_return_schema_1.ReturnStatus.PENDING, product_return_schema_1.ReturnStatus.PROCESSED] },
        })
            .exec();
        const damagedQuantities = new Map();
        damageReturns.forEach((returnRecord) => {
            returnRecord.items.forEach((item) => {
                var _a, _b;
                const productId = typeof item.productId === "string"
                    ? item.productId
                    : (_b = (_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (productId) {
                    const current = damagedQuantities.get(productId) || 0;
                    damagedQuantities.set(productId, current + item.quantity);
                }
            });
        });
        return products.map((product) => (Object.assign(Object.assign({}, product.toObject()), { damagedQuantity: damagedQuantities.get(product._id.toString()) || 0 })));
    }
    async findOne(id) {
        const product = await this.productModel
            .findById(id)
            .populate("companyId")
            .exec();
        if (!product) {
            throw new common_1.NotFoundException("Product not found");
        }
        return product;
    }
    async update(id, dto) {
        var _a, _b;
        if (dto.sku) {
            const existing = await this.productModel
                .findOne({ sku: dto.sku, _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.ConflictException("Product with this SKU already exists");
            }
        }
        const updateBody = Object.assign({}, dto);
        if (dto.dealerPrice !== undefined || dto.commissionPercent !== undefined) {
            const prev = await this.productModel.findById(id);
            const commissionPercent = dto.commissionPercent !== undefined
                ? dto.commissionPercent
                : ((_a = prev === null || prev === void 0 ? void 0 : prev.commissionPercent) !== null && _a !== void 0 ? _a : 0);
            const dealerPrice = dto.dealerPrice !== undefined
                ? dto.dealerPrice
                : ((_b = prev === null || prev === void 0 ? void 0 : prev.dealerPrice) !== null && _b !== void 0 ? _b : 0);
            updateBody.tradePrice = Number((dealerPrice + dealerPrice * (commissionPercent / 100)).toFixed(2));
        }
        const updated = await this.productModel
            .findByIdAndUpdate(id, { $set: updateBody }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Product not found");
        }
        return updated;
    }
    async updateStock(id, quantity, operation = "subtract") {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new common_1.NotFoundException("Product not found");
        }
        if (operation === "subtract" && product.stock < quantity) {
            throw new common_1.ConflictException("Insufficient stock");
        }
        const newStock = operation === "add" ? product.stock + quantity : product.stock - quantity;
        product.stock = Math.max(0, newStock);
        return product.save();
    }
    async remove(id) {
        const res = await this.productModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("Product not found");
        }
    }
    async getUniqueUnits() {
        const units = await this.productModel.distinct("unit").exec();
        return units.filter((u) => u && u.trim().length > 0).sort();
    }
    async getUniqueCategories() {
        const categories = await this.productModel.distinct("category").exec();
        return categories.filter((c) => c && c.trim().length > 0).sort();
    }
    async search(companyId, query, limit) {
        const searchFilter = { companyId };
        if (query) {
            searchFilter.$or = [
                { name: { $regex: query, $options: "i" } },
                { sku: { $regex: query, $options: "i" } },
            ];
        }
        return this.productModel.find(searchFilter).limit(limit).exec();
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_return_schema_1.ProductReturn.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ProductsService);
//# sourceMappingURL=products.service.js.map