import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProductReturnDocument = ProductReturn & Document;

export enum ReturnType {
  CUSTOMER_RETURN = "customer_return",
  DAMAGE_RETURN = "damage_return",
}

export enum ReturnStatus {
  PENDING = "pending",
  PROCESSED = "processed",
  RETURNED = "returned",
}

export class ReturnItem {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  reason?: string;
}

@Schema({ timestamps: true })
export class ProductReturn {
  @Prop({ required: true, unique: true })
  returnNumber: string; // "RET-001"

  @Prop({ required: true, enum: ReturnType })
  returnType: ReturnType;

  // For customer return (customer info stored in payment, not as separate entity)
  // @Prop({ type: Types.ObjectId, ref: 'Customer' })
  // customerId?: string;

  @Prop({ type: Types.ObjectId, ref: "SalesRep" })
  srId?: string;

  // For damage return to company
  @Prop({ type: Types.ObjectId, ref: "Company" })
  companyId?: string;

  // Link to SR Issue if returning from an issue
  @Prop({ type: Types.ObjectId, ref: "SRIssue" })
  issueId?: string;

  @Prop({ type: [ReturnItem], _id: false, required: true })
  items: ReturnItem[];

  @Prop({ enum: ReturnStatus, default: ReturnStatus.PENDING })
  status: ReturnStatus;

  @Prop({ type: Date, default: Date.now })
  returnDate: Date;

  @Prop()
  notes?: string;
}

export const ProductReturnSchema = SchemaFactory.createForClass(ProductReturn);
ProductReturnSchema.index({ returnType: 1, status: 1 });
