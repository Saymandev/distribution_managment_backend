import { Model } from 'mongoose';
import { ProductDocument } from '../../database/schemas/product.schema';
import { SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssue, SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { CreateSRIssueDto } from './dto/create-sr-issue.dto';
export declare class SRIssuesService {
    private readonly srIssueModel;
    private readonly productModel;
    private readonly salesRepModel;
    constructor(srIssueModel: Model<SRIssueDocument>, productModel: Model<ProductDocument>, salesRepModel: Model<SalesRepDocument>);
    generateIssueNumber(): Promise<string>;
    create(dto: CreateSRIssueDto): Promise<SRIssue>;
    findAll(): Promise<SRIssue[]>;
    findOne(id: string): Promise<SRIssue>;
    findBySR(srId: string): Promise<SRIssue[]>;
}
