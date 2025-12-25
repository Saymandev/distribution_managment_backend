import { Model } from 'mongoose';
import { CompanyClaim, CompanyClaimDocument, ClaimStatus } from '../../database/schemas/company-claim.schema';
import { CompanyDocument } from '../../database/schemas/company.schema';
import { CreateCompanyClaimDto } from './dto/create-company-claim.dto';
export declare class CompanyClaimsService {
    private readonly companyClaimModel;
    private readonly companyModel;
    constructor(companyClaimModel: Model<CompanyClaimDocument>, companyModel: Model<CompanyDocument>);
    create(dto: CreateCompanyClaimDto): Promise<CompanyClaim>;
    findAll(): Promise<CompanyClaim[]>;
    findOne(id: string): Promise<CompanyClaim>;
    updateStatus(id: string, status: ClaimStatus, paidDate?: Date): Promise<CompanyClaim>;
    findByCompany(companyId: string): Promise<CompanyClaim[]>;
}
