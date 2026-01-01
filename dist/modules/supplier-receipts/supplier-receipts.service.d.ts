import { Model, Types } from "mongoose";
import { CompanyDocument } from "../../database/schemas/company.schema";
import { ProductDocument } from "../../database/schemas/product.schema";
import { SupplierPaymentDocument, SupplierReceipt, SupplierReceiptDocument } from "../../database/schemas/sr-payment.schema";
import { CreateSupplierReceiptDto } from "./dto/create-supplier-receipt.dto";
import { UpdateSupplierReceiptDto } from "./dto/update-supplier-receipt.dto";
export declare class SupplierReceiptsService {
    private readonly supplierReceiptModel;
    private readonly supplierPaymentModel;
    private readonly companyModel;
    private readonly productModel;
    constructor(supplierReceiptModel: Model<SupplierReceiptDocument>, supplierPaymentModel: Model<SupplierPaymentDocument>, companyModel: Model<CompanyDocument>, productModel: Model<ProductDocument>);
    generateReceiptNumber(): Promise<string>;
    create(dto: CreateSupplierReceiptDto): Promise<SupplierReceipt>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    findByCompany(companyId: string): Promise<any[]>;
    update(id: string, dto: UpdateSupplierReceiptDto): Promise<SupplierReceipt>;
    remove(id: string): Promise<void>;
    getSupplierBalance(companyId?: string): Promise<any[]>;
    findAllWithFilters(filters: {
        companyId?: string;
        startDate?: Date;
        endDate?: Date;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{
        receipts: (SupplierReceipt & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        totalReceiptsValue: number;
        balance: number;
    }>;
    testBalance(companyId?: string): Promise<{
        companyId: string;
        totalPaid: number;
        totalReceived: number;
        balance: number;
        message: string;
        error?: undefined;
    } | {
        error: any;
        companyId?: undefined;
        totalPaid?: undefined;
        totalReceived?: undefined;
        balance?: undefined;
        message?: undefined;
    }>;
}
