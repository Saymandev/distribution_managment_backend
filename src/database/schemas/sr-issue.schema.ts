import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SRIssueDocument = SRIssue & Document;

export class SRIssueItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: Number })
  dealerPrice: number; // 100 tk

  @Prop({ required: true, type: Number })
  tradePrice: number; // 95 tk
}

@Schema({ timestamps: true })
export class SRIssue {
  @Prop({ required: true, unique: true })
  issueNumber: string; // "ISSUE-001"

  @Prop({ type: Types.ObjectId, ref: 'SalesRep', required: true })
  srId: string; // Which SR

  @Prop({ type: [SRIssueItem], _id: false, required: true })
  items: SRIssueItem[];

  @Prop({ required: true, type: Number })
  totalAmount: number; // Sum of (quantity * dealerPrice)

  @Prop({ type: Date, default: Date.now })
  issueDate: Date;

  @Prop()
  notes?: string;
}

export const SRIssueSchema = SchemaFactory.createForClass(SRIssue);
SRIssueSchema.index({ issueNumber: 1 }, { unique: true });
SRIssueSchema.index({ srId: 1, issueDate: -1 });

