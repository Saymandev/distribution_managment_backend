import { Model, Types } from "mongoose";
import { CompanyClaimDocument } from "../../database/schemas/company-claim.schema";
import { Customer, CustomerDocument } from "../../database/schemas/customer.schema";
import { ProductDocument } from "../../database/schemas/product.schema";
import { SRPaymentDocument } from "../../database/schemas/sr-payment.schema";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
export declare class CustomersService {
    private readonly customerModel;
    private readonly srPaymentModel;
    private readonly companyClaimModel;
    private readonly productModel;
    constructor(customerModel: Model<CustomerDocument>, srPaymentModel: Model<SRPaymentDocument>, companyClaimModel: Model<CompanyClaimDocument>, productModel: Model<ProductDocument>);
    create(dto: CreateCustomerDto): Promise<Customer>;
    findAll(): Promise<Customer[]>;
    findOne(id: string): Promise<Customer>;
    update(id: string, dto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
    getCustomerSummaries(companyId?: string, page?: number, limit?: number, searchQuery?: string, startDate?: Date, endDate?: Date): Promise<{
        customers: any[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    searchCustomers(query: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, CustomerDocument, {}, {}> & Customer & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
