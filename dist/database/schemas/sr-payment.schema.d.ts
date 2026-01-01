import { Document, Types } from "mongoose";
export type SRPaymentDocument = SRPayment & Document;
export declare class SRPaymentItem {
    productId: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
    discount: number;
}
export declare class SRPayment {
    receiptNumber?: string;
    srId: string;
    issueId?: string;
    items: SRPaymentItem[];
    totalExpected: number;
    totalReceived: number;
    totalDiscount: number;
    receivedAmount: number;
    companyClaim: number;
    customerDue: number;
    customerInfo?: {
        name?: string;
        address?: string;
        phone?: string;
    };
    paymentDate: Date;
    paymentMethod: string;
    notes?: string;
}
export declare const SRPaymentSchema: import("mongoose").Schema<SRPayment, import("mongoose").Model<SRPayment, any, any, any, Document<unknown, any, SRPayment, any, {}> & SRPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SRPayment, Document<unknown, {}, import("mongoose").FlatRecord<SRPayment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SRPayment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class SupplierPayment {
    paymentNumber: string;
    companyId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: Date;
    reference?: string;
    notes?: string;
    recordedBy?: string;
}
export type SupplierPaymentDocument = SupplierPayment & Document;
export declare const SupplierPaymentSchema: import("mongoose").Schema<SupplierPayment, import("mongoose").Model<SupplierPayment, any, any, any, Document<unknown, any, SupplierPayment, any, {}> & SupplierPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SupplierPayment, Document<unknown, {}, import("mongoose").FlatRecord<SupplierPayment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SupplierPayment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class SupplierReceipt {
    receiptNumber: string;
    companyId: Types.ObjectId;
    items: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantity: number;
        dealerPrice: number;
        tradePrice: number;
        unit: string;
    }>;
    totalValue: number;
    receiptDate: Date;
    invoiceNumber?: string;
    notes?: string;
    recordedBy?: string;
}
export type SupplierReceiptDocument = SupplierReceipt & Document;
export declare const SupplierReceiptSchema: import("mongoose").Schema<SupplierReceipt, import("mongoose").Model<SupplierReceipt, any, any, any, Document<unknown, any, SupplierReceipt, any, {}> & SupplierReceipt & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SupplierReceipt, Document<unknown, {}, import("mongoose").FlatRecord<SupplierReceipt>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SupplierReceipt> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
