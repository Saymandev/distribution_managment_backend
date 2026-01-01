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
exports.SalesRepsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
let SalesRepsService = class SalesRepsService {
    constructor(salesRepModel) {
        this.salesRepModel = salesRepModel;
    }
    async create(dto) {
        var _a;
        const created = new this.salesRepModel(Object.assign(Object.assign({}, dto), { isActive: (_a = dto.isActive) !== null && _a !== void 0 ? _a : true }));
        return created.save();
    }
    async findAll(companyId) {
        const query = companyId ? { companyId } : {};
        return this.salesRepModel
            .find(query)
            .populate("companyId", "name code")
            .sort({ name: 1 })
            .exec();
    }
    async findOne(id) {
        const salesRep = await this.salesRepModel.findById(id).exec();
        if (!salesRep) {
            throw new common_1.NotFoundException("Sales Rep not found");
        }
        return salesRep;
    }
    async update(id, dto) {
        const updated = await this.salesRepModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Sales Rep not found");
        }
        return updated;
    }
    async remove(id) {
        const res = await this.salesRepModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("Sales Rep not found");
        }
    }
};
exports.SalesRepsService = SalesRepsService;
exports.SalesRepsService = SalesRepsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(salesrep_schema_1.SalesRep.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SalesRepsService);
//# sourceMappingURL=salesreps.service.js.map