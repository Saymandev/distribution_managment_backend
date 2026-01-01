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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../../database/schemas/company.schema");
let CompaniesService = class CompaniesService {
    constructor(companyModel) {
        this.companyModel = companyModel;
    }
    async create(dto) {
        const existing = await this.companyModel.findOne({ code: dto.code }).exec();
        if (existing) {
            throw new common_1.ConflictException("Company with this code already exists");
        }
        const created = new this.companyModel(dto);
        return created.save();
    }
    async findAll() {
        return this.companyModel.find().sort({ name: 1 }).exec();
    }
    async findOne(id) {
        const company = await this.companyModel.findById(id).exec();
        if (!company) {
            throw new common_1.NotFoundException("Company not found");
        }
        return company;
    }
    async update(id, dto) {
        const updated = await this.companyModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Company not found");
        }
        return updated;
    }
    async remove(id) {
        const res = await this.companyModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("Company not found");
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map