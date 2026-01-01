import { SRIssuesService } from "./sr-issues.service";
import { CreateSRIssueDto } from "./dto/create-sr-issue.dto";
export declare class SRIssuesController {
    private readonly srIssuesService;
    constructor(srIssuesService: SRIssuesService);
    create(createSRIssueDto: CreateSRIssueDto): Promise<import("../../database/schemas/sr-issue.schema").SRIssue>;
    findAll(srId?: string): Promise<import("../../database/schemas/sr-issue.schema").SRIssue[]>;
    getOptimized(companyId?: string): Promise<{
        issues: import("../../database/schemas/sr-issue.schema").SRIssue[];
        salesReps: import("../../database/schemas/salesrep.schema").SalesRep[];
        products: import("../../database/schemas/product.schema").Product[];
        payments: import("../../database/schemas/sr-payment.schema").SRPayment[];
        returns: import("../../database/schemas/product-return.schema").ProductReturn[];
        claims: import("../../database/schemas/company-claim.schema").CompanyClaim[];
        dueAmounts: Record<string, {
            totalAmount: number;
            receivedAmount: number;
            due: number;
        }>;
    }>;
    findOne(id: string): Promise<import("../../database/schemas/sr-issue.schema").SRIssue>;
}
