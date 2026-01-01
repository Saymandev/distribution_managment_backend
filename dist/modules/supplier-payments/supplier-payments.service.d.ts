import { Model, Types } from "mongoose";
import { CompanyDocument } from "../../database/schemas/company.schema";
import { SupplierPayment, SupplierPaymentDocument } from "../../database/schemas/sr-payment.schema";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { UpdateSupplierPaymentDto } from "./dto/update-supplier-payment.dto";
export declare class SupplierPaymentsService {
    private readonly supplierPaymentModel;
    private readonly companyModel;
    constructor(supplierPaymentModel: Model<SupplierPaymentDocument>, companyModel: Model<CompanyDocument>);
    generatePaymentNumber(): Promise<string>;
    create(dto: CreateSupplierPaymentDto): Promise<SupplierPayment>;
    findAll(): Promise<SupplierPayment[]>;
    findOne(id: string): Promise<SupplierPayment>;
    findByCompany(companyId: string): Promise<SupplierPayment[]>;
    update(id: string, dto: UpdateSupplierPaymentDto): Promise<SupplierPayment>;
    remove(id: string): Promise<void>;
    findAllWithFilters(filters: {
        companyId?: string;
        startDate?: Date;
        endDate?: Date;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{
        payments: (import("mongoose").Document<unknown, {}, SupplierPaymentDocument, {}, {}> & SupplierPayment & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
