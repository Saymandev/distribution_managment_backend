import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { UpdateSupplierPaymentDto } from "./dto/update-supplier-payment.dto";
import { SupplierPaymentsService } from "./supplier-payments.service";
export declare class SupplierPaymentsController {
    private readonly supplierPaymentsService;
    constructor(supplierPaymentsService: SupplierPaymentsService);
    create(createSupplierPaymentDto: CreateSupplierPaymentDto): Promise<import("../../database/schemas/sr-payment.schema").SupplierPayment>;
    findAll(companyId?: string, startDate?: string, endDate?: string, search?: string, page?: string, limit?: string): Promise<{
        payments: (import("mongoose").Document<unknown, {}, import("../../database/schemas/sr-payment.schema").SupplierPaymentDocument, {}, {}> & import("../../database/schemas/sr-payment.schema").SupplierPayment & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<import("../../database/schemas/sr-payment.schema").SupplierPayment>;
    update(id: string, updateSupplierPaymentDto: UpdateSupplierPaymentDto): Promise<import("../../database/schemas/sr-payment.schema").SupplierPayment>;
    remove(id: string): Promise<void>;
}
