import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Expense,
  ExpenseDocument,
} from "../../database/schemas/expense.schema";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const created = new this.expenseModel({
      ...dto,
      date: new Date(dto.date),
    });
    return created.save();
  }

  async findAll(
    companyId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Expense[]> {
    console.log(`🔍 ExpensesService.findAll called with: companyId=${companyId}, startDate=${startDate}, endDate=${endDate}`);
    const filter: any = {};

    if (companyId) {
      filter.companyId = companyId;
      console.log(`🔍 Filter updated with companyId: ${filter.companyId}`);
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      console.log(`🔍 Filter updated with date range: ${JSON.stringify(filter.date)}`);
    }

    console.log(`🔍 Final filter for findAll: ${JSON.stringify(filter)}`);
    return this.expenseModel.find(filter).sort({ date: -1 }).exec();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException("Expense not found");
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const updateData: any = { ...dto };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    const updated = await this.expenseModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Expense not found");
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Expense not found");
    }
  }

  async getTotalByDateRange(startDate: Date, endDate: Date): Promise<number> {
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
}
