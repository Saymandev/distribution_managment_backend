import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyClaimDocument = CompanyClaim & Document;

export enum ClaimStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  PAID = 'paid',
}

export class ClaimItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: Number })
  dealerPrice: number; // 100 tk

  @Prop({ required: true, type: Number })
  commissionRate: number; // 6%

  @Prop({ required: true, type: Number })
  commissionAmount: number; // 6 tk

  @Prop({ required: true, type: Number })
  srPayment: number; // 95 tk (what SR paid)

  @Prop({ required: true, type: Number })
  netFromCompany: number; // 11 tk (100 + 6 - 95)
}

@Schema({ timestamps: true })
export class CompanyClaim {
  @Prop({ required: true, unique: true })
  claimNumber: string; // "CLAIM-001"

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: string; // Which company

  @Prop({ type: Types.ObjectId, ref: 'SRPayment' })
  paymentId?: string; // Related SR payment

  @Prop({ type: Types.ObjectId, ref: 'SRIssue' })
  issueId?: string; // Related SR issue (one issue = one claim)

  @Prop({ type: [ClaimItem], _id: false, required: true })
  items: ClaimItem[];

  @Prop({ required: true, type: Number })
  totalDealerPrice: number; // Sum of DP

  @Prop({ required: true, type: Number })
  totalCommission: number; // Sum of commission

  @Prop({ required: true, type: Number })
  totalClaim: number; // DP + Commission (106 tk)

  @Prop({ required: true, type: Number })
  totalSRPayment: number; // What SR paid (95 tk)

  @Prop({ required: true, type: Number })
  netFromCompany: number; // Net amount (11 tk)

  @Prop({ enum: ClaimStatus, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Prop({ type: Date })
  paidDate?: Date;

  @Prop()
  notes?: string;
}

export const CompanyClaimSchema = SchemaFactory.createForClass(CompanyClaim);
CompanyClaimSchema.index({ claimNumber: 1 }, { unique: true });
CompanyClaimSchema.index({ companyId: 1, status: 1 });
CompanyClaimSchema.index({ issueId: 1 }, { unique: true, sparse: true }); // One claim per issue

