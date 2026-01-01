import { Model } from "mongoose";
import { CompanyClaim, CompanyClaimDocument } from "../../database/schemas/company-claim.schema";
import { ProductReturn, ProductReturnDocument } from "../../database/schemas/product-return.schema";
import { Product, ProductDocument } from "../../database/schemas/product.schema";
import { SalesRep, SalesRepDocument } from "../../database/schemas/salesrep.schema";
import { SRIssue, SRIssueDocument } from "../../database/schemas/sr-issue.schema";
import { SRPayment, SRPaymentDocument } from "../../database/schemas/sr-payment.schema";
import { CreateSRIssueDto } from "./dto/create-sr-issue.dto";
export declare class SRIssuesService {
    private readonly srIssueModel;
    private readonly productModel;
    private readonly salesRepModel;
    private readonly srPaymentModel;
    private readonly productReturnModel;
    private readonly companyClaimModel;
    constructor(srIssueModel: Model<SRIssueDocument>, productModel: Model<ProductDocument>, salesRepModel: Model<SalesRepDocument>, srPaymentModel: Model<SRPaymentDocument>, productReturnModel: Model<ProductReturnDocument>, companyClaimModel: Model<CompanyClaimDocument>);
    generateIssueNumber(): Promise<string>;
    create(dto: CreateSRIssueDto): Promise<SRIssue>;
    findAll(): Promise<SRIssue[]>;
    findOne(id: string): Promise<SRIssue>;
    findBySR(srId: string): Promise<SRIssue[]>;
    getOptimized(companyId?: string): Promise<{
        issues: SRIssue[];
        salesReps: SalesRep[];
        products: Product[];
        payments: SRPayment[];
        returns: ProductReturn[];
        claims: CompanyClaim[];
        dueAmounts: Record<string, {
            totalAmount: number;
            receivedAmount: number;
            due: number;
        }>;
    }>;
}
