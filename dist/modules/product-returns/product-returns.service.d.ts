import { Model } from 'mongoose';
import { CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { CompanyDocument } from '../../database/schemas/company.schema';
import { ProductReturn, ProductReturnDocument, ReturnStatus } from '../../database/schemas/product-return.schema';
import { ProductDocument } from '../../database/schemas/product.schema';
import { SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
export declare class ProductReturnsService {
    private readonly productReturnModel;
    private readonly productModel;
    private readonly srIssueModel;
    private readonly srPaymentModel;
    private readonly companyClaimModel;
    private readonly companyModel;
    constructor(productReturnModel: Model<ProductReturnDocument>, productModel: Model<ProductDocument>, srIssueModel: Model<SRIssueDocument>, srPaymentModel: Model<SRPaymentDocument>, companyClaimModel: Model<CompanyClaimDocument>, companyModel: Model<CompanyDocument>);
    create(dto: CreateProductReturnDto): Promise<ProductReturn>;
    findAll(): Promise<ProductReturn[]>;
    findOne(id: string): Promise<ProductReturn>;
    updateStatus(id: string, status: ReturnStatus): Promise<ProductReturn>;
    private adjustIssueForReturn;
}
