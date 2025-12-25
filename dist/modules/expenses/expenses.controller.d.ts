import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(createExpenseDto: CreateExpenseDto): Promise<import("../../database/schemas/expense.schema").Expense>;
    findAll(): Promise<import("../../database/schemas/expense.schema").Expense[]>;
    findOne(id: string): Promise<import("../../database/schemas/expense.schema").Expense>;
    update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<import("../../database/schemas/expense.schema").Expense>;
    remove(id: string): Promise<void>;
}
