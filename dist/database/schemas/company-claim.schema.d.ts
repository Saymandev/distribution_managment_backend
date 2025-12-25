import { Document, Types } from 'mongoose';
export type CompanyClaimDocument = CompanyClaim & Document;
export declare enum ClaimStatus {
    PENDING = "pending",
    CLAIMED = "claimed",
    PAID = "paid"
}
export declare class ClaimItem {
    productId: string;
    quantity: number;
    dealerPrice: number;
    commissionRate: number;
    commissionAmount: number;
    srPayment: number;
    netFromCompany: number;
}
export declare class CompanyClaim {
    claimNumber: string;
    companyId: string;
    paymentId?: string;
    issueId?: string;
    items: ClaimItem[];
    totalDealerPrice: number;
    totalCommission: number;
    totalClaim: number;
    totalSRPayment: number;
    netFromCompany: number;
    status: ClaimStatus;
    paidDate?: Date;
    notes?: string;
}
export declare const CompanyClaimSchema: import("mongoose").Schema<CompanyClaim, import("mongoose").Model<CompanyClaim, any, any, any, Document<unknown, any, CompanyClaim, any, {}> & CompanyClaim & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CompanyClaim, Document<unknown, {}, import("mongoose").FlatRecord<CompanyClaim>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<CompanyClaim> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
