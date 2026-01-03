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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const expense_schema_1 = require("../../database/schemas/expense.schema");
let ExpensesService = class ExpensesService {
    constructor(expenseModel) {
        this.expenseModel = expenseModel;
    }
    async create(dto) {
        const created = new this.expenseModel(Object.assign(Object.assign({}, dto), { date: new Date(dto.date) }));
        return created.save();
    }
    async findAll(companyId, startDate, endDate) {
        const filter = {};
        if (companyId) {
            filter.companyId = companyId;
        }
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        return this.expenseModel.find(filter).sort({ date: -1 }).exec();
    }
    async findOne(id) {
        const expense = await this.expenseModel.findById(id).exec();
        if (!expense) {
            throw new common_1.NotFoundException("Expense not found");
        }
        return expense;
    }
    async update(id, dto) {
        const updateData = Object.assign({}, dto);
        if (dto.date) {
            updateData.date = new Date(dto.date);
        }
        const updated = await this.expenseModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Expense not found");
        }
        return updated;
    }
    async remove(id) {
        const res = await this.expenseModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("Expense not found");
        }
    }
    async getTotalByDateRange(startDate, endDate) {
        const result = await this.expenseModel.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(expense_schema_1.Expense.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map