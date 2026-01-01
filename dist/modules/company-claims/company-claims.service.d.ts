import { Model } from "mongoose";
import { ClaimStatus, CompanyClaim, CompanyClaimDocument } from "../../database/schemas/company-claim.schema";
import { CompanyDocument } from "../../database/schemas/company.schema";
import { SRPaymentDocument } from "../../database/schemas/sr-payment.schema";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { CreateCompanyClaimDto } from "./dto/create-company-claim.dto";
export declare class CompanyClaimsService {
    private readonly companyClaimModel;
    private readonly companyModel;
    private readonly srPaymentModel;
    private readonly notificationsGateway;
    constructor(companyClaimModel: Model<CompanyClaimDocument>, companyModel: Model<CompanyDocument>, srPaymentModel: Model<SRPaymentDocument>, notificationsGateway: NotificationsGateway);
    create(dto: CreateCompanyClaimDto): Promise<CompanyClaim>;
    findAll(companyId?: string, page?: number, limit?: number, timePeriod?: "all" | "week" | "month" | "year", searchQuery?: string): Promise<{
        claims: CompanyClaim[];
        pagination: any;
    }>;
    findOne(id: string): Promise<CompanyClaim>;
    update(id: string, updateData: any): Promise<CompanyClaim>;
    updateStatus(id: string, status: ClaimStatus, paidDate?: Date): Promise<CompanyClaim>;
}
