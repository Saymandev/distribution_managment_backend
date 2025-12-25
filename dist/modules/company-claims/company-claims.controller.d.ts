import { CompanyClaimsService } from './company-claims.service';
import { CreateCompanyClaimDto } from './dto/create-company-claim.dto';
import { ClaimStatus } from '../../database/schemas/company-claim.schema';
export declare class CompanyClaimsController {
    private readonly companyClaimsService;
    constructor(companyClaimsService: CompanyClaimsService);
    create(createCompanyClaimDto: CreateCompanyClaimDto): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
    findAll(companyId?: string): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim[]>;
    findOne(id: string): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
    updateStatus(id: string, body: {
        status: ClaimStatus;
        paidDate?: Date;
    }): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
}
