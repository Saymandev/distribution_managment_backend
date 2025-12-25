import { Document, Types } from 'mongoose';
export type SRPaymentDocument = SRPayment & Document;
export declare class SRPaymentItem {
    productId: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
    discount: number;
}
export declare class SRPayment {
    receiptNumber: string;
    srId: string;
    issueId?: string;
    items: SRPaymentItem[];
    totalExpected: number;
    totalReceived: number;
    totalDiscount: number;
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
