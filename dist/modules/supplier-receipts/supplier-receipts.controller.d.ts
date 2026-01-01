import { CreateSupplierReceiptDto } from "./dto/create-supplier-receipt.dto";
import { UpdateSupplierReceiptDto } from "./dto/update-supplier-receipt.dto";
import { SupplierReceiptsService } from "./supplier-receipts.service";
export declare class SupplierReceiptsController {
    private readonly supplierReceiptsService;
    constructor(supplierReceiptsService: SupplierReceiptsService);
    create(createSupplierReceiptDto: CreateSupplierReceiptDto): Promise<import("../../database/schemas/sr-payment.schema").SupplierReceipt>;
    findAll(companyId?: string, startDate?: string, endDate?: string, search?: string, page?: string, limit?: string): Promise<{
        receipts: (import("../../database/schemas/sr-payment.schema").SupplierReceipt & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        totalReceiptsValue: number;
    }>;
    getSupplierBalance(companyId?: string): Promise<any[]>;
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
    findOne(id: string): Promise<any>;
    update(id: string, updateSupplierReceiptDto: UpdateSupplierReceiptDto): Promise<import("../../database/schemas/sr-payment.schema").SupplierReceipt>;
    remove(id: string): Promise<void>;
}
