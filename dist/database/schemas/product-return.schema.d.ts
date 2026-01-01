import { Document, Types } from "mongoose";
export type ProductReturnDocument = ProductReturn & Document;
export declare enum ReturnType {
    CUSTOMER_RETURN = "customer_return",
    DAMAGE_RETURN = "damage_return"
}
export declare enum ReturnStatus {
    PENDING = "pending",
    PROCESSED = "processed",
    RETURNED = "returned"
}
export declare class ReturnItem {
    productId: string;
    quantity: number;
    reason?: string;
}
export declare class ProductReturn {
    returnNumber: string;
    returnType: ReturnType;
    srId?: string;
    companyId?: string;
    issueId?: string;
    items: ReturnItem[];
    status: ReturnStatus;
    returnDate: Date;
    notes?: string;
}
export declare const ProductReturnSchema: import("mongoose").Schema<ProductReturn, import("mongoose").Model<ProductReturn, any, any, any, Document<unknown, any, ProductReturn, any, {}> & ProductReturn & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProductReturn, Document<unknown, {}, import("mongoose").FlatRecord<ProductReturn>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ProductReturn> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
