import { CompaniesService } from "./companies.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    findAll(): Promise<import("../../database/schemas/company.schema").Company[]>;
    findOne(id: string): Promise<import("../../database/schemas/company.schema").Company>;
    create(dto: CreateCompanyDto): Promise<import("../../database/schemas/company.schema").Company>;
    update(id: string, dto: UpdateCompanyDto): Promise<import("../../database/schemas/company.schema").Company>;
    remove(id: string): Promise<void>;
}
