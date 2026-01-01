import { CreateSRPaymentDto } from "./dto/create-sr-payment.dto";
import { UpdateSRPaymentDto } from "./dto/update-sr-payment.dto";
import { SRPaymentsService } from "./sr-payments.service";
export declare class SRPaymentsController {
    private readonly srPaymentsService;
    constructor(srPaymentsService: SRPaymentsService);
    create(createSRPaymentDto: CreateSRPaymentDto): Promise<import("../../database/schemas/sr-payment.schema").SRPayment>;
    findAll(srId?: string): Promise<any[]>;
    getOptimized(companyId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateSRPaymentDto: UpdateSRPaymentDto): Promise<import("../../database/schemas/sr-payment.schema").SRPayment>;
    remove(id: string): Promise<void>;
}
