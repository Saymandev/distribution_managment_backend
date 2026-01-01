import { Model } from "mongoose";
import { Expense, ExpenseDocument } from "../../database/schemas/expense.schema";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
export declare class ExpensesService {
    private readonly expenseModel;
    constructor(expenseModel: Model<ExpenseDocument>);
    create(dto: CreateExpenseDto): Promise<Expense>;
    findAll(companyId?: string, startDate?: string, endDate?: string): Promise<Expense[]>;
    findOne(id: string): Promise<Expense>;
    update(id: string, dto: UpdateExpenseDto): Promise<Expense>;
    remove(id: string): Promise<void>;
    getTotalByDateRange(startDate: Date, endDate: Date): Promise<number>;
}
