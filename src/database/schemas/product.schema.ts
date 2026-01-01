import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  companyId: string; // Which company supplies

  @Prop()
  category?: string;

  @Prop({ required: true })
  unit: string; // pcs, kg, box

  @Prop({ required: true, type: Number })
  dealerPrice: number; // DP - what company charges you

  @Prop({ required: true, type: Number })
  commissionPercent: number; // e.g. 6 for 6%

  @Prop({ required: true, type: Number })
  tradePrice: number; // TP - computed automatically: DP + DP * (commissionPercent / 100)

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: Number, default: 0 })
  reorderLevel: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ companyId: 1 });
