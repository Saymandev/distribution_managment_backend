import { Document, Types } from 'mongoose';
export type SalesRepDocument = SalesRep & Document;
export declare class SalesRep {
    name: string;
    companyId: string;
    phone?: string;
    email?: string;
    address?: string;
    isActive: boolean;
}
export declare const SalesRepSchema: import("mongoose").Schema<SalesRep, import("mongoose").Model<SalesRep, any, any, any, Document<unknown, any, SalesRep, any, {}> & SalesRep & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SalesRep, Document<unknown, {}, import("mongoose").FlatRecord<SalesRep>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SalesRep> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
