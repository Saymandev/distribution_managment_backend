import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<import("../../database/schemas/customer.schema").Customer>;
    findAll(): Promise<import("../../database/schemas/customer.schema").Customer[]>;
    getCustomerSummaries(companyId?: string, page?: string, limit?: string, search?: string, startDate?: string, endDate?: string): Promise<{
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
    searchCustomers(query: string, limit?: string): Promise<(import("mongoose").Document<unknown, {}, import("../../database/schemas/customer.schema").CustomerDocument, {}, {}> & import("../../database/schemas/customer.schema").Customer & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("../../database/schemas/customer.schema").Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<import("../../database/schemas/customer.schema").Customer>;
    remove(id: string): Promise<void>;
}
