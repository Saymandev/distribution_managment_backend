import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ExpenseDocument = Expense & Document;

export enum ExpenseCategory {
  UTILITY = "utility",
  RENT = "rent",
  SALARY = "salary",
  OTHER = "other",
}

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true, enum: ExpenseCategory })
  category: ExpenseCategory;

  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  companyId: string; // Which company this expense belongs to

  @Prop()
  subCategory?: string; // "Electricity", "Office Rent"

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop()
  description?: string;

  @Prop()
  receiptNumber?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
