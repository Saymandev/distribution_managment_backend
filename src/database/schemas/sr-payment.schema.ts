import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type SRPaymentDocument = SRPayment & Document;

export class SRPaymentItem {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
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
  @Prop({ unique: true, sparse: true }) // `sparse: true` allows multiple documents to have `null` for a unique field
  receiptNumber?: string; // "PAY-001"

  @Prop({ type: Types.ObjectId, ref: "SalesRep", required: true })
  srId: string;

  @Prop({ type: Types.ObjectId, ref: "SRIssue" })
  issueId?: string; // Related issue (optional)

  @Prop({ type: [SRPaymentItem], _id: false, required: true })
  items: SRPaymentItem[];

  @Prop({ required: true, type: Number })
  totalExpected: number; // Sum of (quantity * dealerPrice)

  @Prop({ required: true, type: Number })
  totalReceived: number; // Sum of (quantity * tradePrice)

  @Prop({ required: true, type: Number })
  totalDiscount: number; // Sum of discounts

  @Prop({ required: true, type: Number, default: 0 })
  receivedAmount: number; // Actual cash received from customer

  @Prop({ required: true, type: Number, default: 0 })
  companyClaim: number; // Discount given by SR (to be claimed from company)

  @Prop({ required: true, type: Number, default: 0 })
  customerDue: number; // Remaining amount customer owes

  @Prop({
    type: {
      name: { type: String },
      address: { type: String },
      phone: { type: String },
    },
    _id: false,
    required: false,
  })
  customerInfo?: {
    name?: string;
    address?: string;
    phone?: string;
  };

  @Prop({ type: Date, default: Date.now })
  paymentDate: Date;

  @Prop({ required: true })
  paymentMethod: string; // cash, bank, bkash, nagad

  @Prop()
  notes?: string;
}

export const SRPaymentSchema = SchemaFactory.createForClass(SRPayment);
SRPaymentSchema.index({ srId: 1, paymentDate: -1 });

// New schema for payments TO suppliers (money outflow)
@Schema({ timestamps: true })
export class SupplierPayment {
  @Prop({ required: true, unique: true })
  paymentNumber: string; // "SUP-PAY-001"

  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  companyId: string; // Which supplier company

  @Prop({ required: true, type: Number })
  amount: number; // Amount paid to supplier

  @Prop({ required: true })
  paymentMethod: string; // cash, bank, bkash, nagad, online

  @Prop({ type: Date, default: Date.now })
  paymentDate: Date;

  @Prop()
  reference?: string; // Bank reference, transaction ID, etc.

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "User" })
  recordedBy?: string; // Who recorded this payment
}

export type SupplierPaymentDocument = SupplierPayment & Document;

export const SupplierPaymentSchema =
  SchemaFactory.createForClass(SupplierPayment);
SupplierPaymentSchema.index({ companyId: 1, paymentDate: -1 });

// New schema for product receipts FROM suppliers (product inflow)
@Schema({ timestamps: true })
export class SupplierReceipt {
  @Prop({ required: true, unique: true })
  receiptNumber: string; // "SUP-RCP-001"

  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  companyId: Types.ObjectId; // Which supplier company

  @Prop({ type: [Object], required: true }) // Array of products received
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    dealerPrice: number; // Price supplier charges us
    tradePrice: number; // Our selling price
    unit: string;
  }>;

  @Prop({ required: true, type: Number })
  totalValue: number; // Total dealer price value of received products

  @Prop({ type: Date, default: Date.now })
  receiptDate: Date;

  @Prop()
  invoiceNumber?: string; // Supplier's invoice number

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "User" })
  recordedBy?: string; // Who recorded this receipt
}

export type SupplierReceiptDocument = SupplierReceipt & Document;

export const SupplierReceiptSchema =
  SchemaFactory.createForClass(SupplierReceipt);
SupplierReceiptSchema.index({ companyId: 1, receiptDate: -1 });
