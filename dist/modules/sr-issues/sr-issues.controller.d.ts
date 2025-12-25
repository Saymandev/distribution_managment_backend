import { SRIssuesService } from './sr-issues.service';
import { CreateSRIssueDto } from './dto/create-sr-issue.dto';
export declare class SRIssuesController {
    private readonly srIssuesService;
    constructor(srIssuesService: SRIssuesService);
    create(createSRIssueDto: CreateSRIssueDto): Promise<import("../../database/schemas/sr-issue.schema").SRIssue>;
    findAll(srId?: string): Promise<import("../../database/schemas/sr-issue.schema").SRIssue[]>;
    findOne(id: string): Promise<import("../../database/schemas/sr-issue.schema").SRIssue>;
}
