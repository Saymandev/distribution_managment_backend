import { Model } from 'mongoose';
import { CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { CompanyDocument } from '../../database/schemas/company.schema';
import { ProductDocument } from '../../database/schemas/product.schema';
import { SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
import { CreateSRPaymentDto } from './dto/create-sr-payment.dto';
import { UpdateSRPaymentDto } from './dto/update-sr-payment.dto';
export declare class SRPaymentsService {
    private readonly srPaymentModel;
    private readonly salesRepModel;
    private readonly srIssueModel;
    private readonly productModel;
    private readonly companyModel;
    private readonly companyClaimModel;
    constructor(srPaymentModel: Model<SRPaymentDocument>, salesRepModel: Model<SalesRepDocument>, srIssueModel: Model<SRIssueDocument>, productModel: Model<ProductDocument>, companyModel: Model<CompanyDocument>, companyClaimModel: Model<CompanyClaimDocument>);
    generateReceiptNumber(): Promise<string>;
    generateClaimNumber(): Promise<string>;
    createClaimFromPayment(payment: SRPaymentDocument): Promise<CompanyClaimDocument>;
    updateClaimFromPayment(payment: SRPaymentDocument): Promise<CompanyClaimDocument | null>;
    create(dto: CreateSRPaymentDto): Promise<SRPayment>;
    findAll(): Promise<any[]>;
    calculateDueAmount(issueId: string): Promise<{
        totalAmount: number;
        receivedAmount: number;
        due: number;
    }>;
    findOne(id: string): Promise<any>;
    findBySR(srId: string): Promise<SRPayment[]>;
    update(id: string, dto: UpdateSRPaymentDto): Promise<SRPayment>;
    remove(id: string): Promise<void>;
}
