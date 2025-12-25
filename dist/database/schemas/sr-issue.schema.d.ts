import { Document, Types } from 'mongoose';
export type SRIssueDocument = SRIssue & Document;
export declare class SRIssueItem {
    productId: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
}
export declare class SRIssue {
    issueNumber: string;
    srId: string;
    items: SRIssueItem[];
    totalAmount: number;
    issueDate: Date;
    notes?: string;
}
export declare const SRIssueSchema: import("mongoose").Schema<SRIssue, import("mongoose").Model<SRIssue, any, any, any, Document<unknown, any, SRIssue, any, {}> & SRIssue & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SRIssue, Document<unknown, {}, import("mongoose").FlatRecord<SRIssue>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SRIssue> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
