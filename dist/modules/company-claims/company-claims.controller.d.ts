import { ClaimStatus } from "../../database/schemas/company-claim.schema";
import { CompanyClaimsService } from "./company-claims.service";
import { CreateCompanyClaimDto } from "./dto/create-company-claim.dto";
export declare class CompanyClaimsController {
    private readonly companyClaimsService;
    constructor(companyClaimsService: CompanyClaimsService);
    create(createCompanyClaimDto: CreateCompanyClaimDto): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
    findAll(companyId?: string, page?: number, limit?: number, timePeriod?: "all" | "week" | "month" | "year", searchQuery?: string): Promise<{
        claims: import("../../database/schemas/company-claim.schema").CompanyClaim[];
        pagination: any;
    }>;
    findOne(id: string): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
    update(id: string, updateData: any): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
    updateStatus(id: string, body: {
        status: ClaimStatus;
        paidDate?: Date;
    }): Promise<import("../../database/schemas/company-claim.schema").CompanyClaim>;
}
