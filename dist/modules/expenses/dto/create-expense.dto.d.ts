import { ExpenseCategory } from "../../../database/schemas/expense.schema";
export declare class CreateExpenseDto {
    category: ExpenseCategory;
    subCategory?: string;
    amount: number;
    date: string;
    description?: string;
    receiptNumber?: string;
    companyId: string;
}
