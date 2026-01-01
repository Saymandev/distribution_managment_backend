import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CompanyClaimDocument = CompanyClaim & Document;

export enum ClaimStatus {
  PENDING = "pending",
  CLAIMED = "claimed",
  PAID = "paid",
}

export class ClaimItem {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: Number })
  dealerPrice: number; // 100 tk (expected price)

  @Prop({ required: true, type: Number })
  tradePrice: number; // 95 tk (actual price SR paid)

  @Prop({ required: true, type: Number })
  discount: number; // 5 tk (dealerPrice - tradePrice)

  @Prop({ required: true, type: Number })
  srPayment: number; // 95 tk (what SR paid = quantity * tradePrice)

  @Prop({ required: true, type: Number })
  netFromCompany: number; // 5 tk (discount we claim from company)
}

@Schema({ timestamps: true })
export class CompanyClaim {
  @Prop({ required: true, unique: true })
  claimNumber: string; // "CLAIM-001"

  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  companyId: string; // Which company

  @Prop({ type: Types.ObjectId, ref: "SRPayment" })
  paymentId?: string; // Related SR payment

  @Prop({ type: Types.ObjectId, ref: "SRIssue" })
  issueId?: string; // Related SR issue (one issue = one claim)

  @Prop({ type: [ClaimItem], _id: false, required: true })
  items: ClaimItem[];

  @Prop({ required: true, type: Number })
  totalDealerPrice: number; // Sum of DP (expected amount)

  @Prop({ required: true, type: Number })
  totalCompanyClaim: number; // Total discount to claim from company

  @Prop({ required: true, type: Number })
  totalSRPayment: number; // What SR paid (actual received)

  @Prop({ required: true, type: Number })
  netFromCompany: number; // Net amount we get from company (discount)

  @Prop({ enum: ClaimStatus, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Prop({ type: Date })
  paidDate?: Date;

  @Prop()
  notes?: string;
}

export const CompanyClaimSchema = SchemaFactory.createForClass(CompanyClaim);
CompanyClaimSchema.index({ companyId: 1, status: 1 });
CompanyClaimSchema.index({ issueId: 1 }, { unique: true, sparse: true }); // One claim per issue
