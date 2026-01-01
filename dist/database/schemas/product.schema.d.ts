import { Document, Types } from "mongoose";
export type ProductDocument = Product & Document;
export declare class Product {
    name: string;
    sku: string;
    companyId: string;
    category?: string;
    unit: string;
    dealerPrice: number;
    commissionPercent: number;
    tradePrice: number;
    stock: number;
    reorderLevel: number;
    isActive: boolean;
}
export declare const ProductSchema: import("mongoose").Schema<Product, import("mongoose").Model<Product, any, any, any, Document<unknown, any, Product, any, {}> & Product & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Product, Document<unknown, {}, import("mongoose").FlatRecord<Product>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Product> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
