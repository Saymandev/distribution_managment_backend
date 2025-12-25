import { Document } from 'mongoose';
export type ExpenseDocument = Expense & Document;
export declare enum ExpenseCategory {
    UTILITY = "utility",
    RENT = "rent",
    SALARY = "salary",
    OTHER = "other"
}
export declare class Expense {
    category: ExpenseCategory;
    subCategory?: string;
    amount: number;
    date: Date;
    description?: string;
    receiptNumber?: string;
}
export declare const ExpenseSchema: import("mongoose").Schema<Expense, import("mongoose").Model<Expense, any, any, any, Document<unknown, any, Expense, any, {}> & Expense & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Expense, Document<unknown, {}, import("mongoose").FlatRecord<Expense>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Expense> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
