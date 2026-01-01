import { Model } from "mongoose";
import { Company, CompanyDocument } from "../../database/schemas/company.schema";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
export declare class CompaniesService {
    private readonly companyModel;
    constructor(companyModel: Model<CompanyDocument>);
    create(dto: CreateCompanyDto): Promise<Company>;
    findAll(): Promise<Company[]>;
    findOne(id: string): Promise<Company>;
    update(id: string, dto: UpdateCompanyDto): Promise<Company>;
    remove(id: string): Promise<void>;
}
