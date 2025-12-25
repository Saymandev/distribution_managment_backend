import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SRPaymentDocument = SRPayment & Document;

export class SRPaymentItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: Number })
  dealerPrice: number; // 100 tk (expected)

  @Prop({ required: true, type: Number })
  tradePrice: number; // 95 tk (actual received)

  @Prop({ required: true, type: Number })
  discount: number; // 5 tk (dealerPrice - tradePrice)
}

@Schema({ timestamps: true })
export class SRPayment {
  @Prop({ required: true, unique: true })
  receiptNumber: string; // "PAY-001"

  @Prop({ type: Types.ObjectId, ref: 'SalesRep', required: true })
  srId: string;

  @Prop({ type: Types.ObjectId, ref: 'SRIssue' })
  issueId?: string; // Related issue (optional)

  @Prop({ type: [SRPaymentItem], _id: false, required: true })
  items: SRPaymentItem[];

  @Prop({ required: true, type: Number })
  totalExpected: number; // Sum of (quantity * dealerPrice)

  @Prop({ required: true, type: Number })
  totalReceived: number; // Sum of (quantity * tradePrice)

  @Prop({ required: true, type: Number })
  totalDiscount: number; // Sum of discounts

  @Prop({ type: Date, default: Date.now })
  paymentDate: Date;

  @Prop({ required: true })
  paymentMethod: string; // cash, bank, bkash, nagad

  @Prop()
  notes?: string;
}

export const SRPaymentSchema = SchemaFactory.createForClass(SRPayment);
SRPaymentSchema.index({ receiptNumber: 1 }, { unique: true });
SRPaymentSchema.index({ srId: 1, paymentDate: -1 });

