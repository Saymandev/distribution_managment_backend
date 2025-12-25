import { SalesRepsService } from './salesreps.service';
import { CreateSalesRepDto } from './dto/create-salesrep.dto';
import { UpdateSalesRepDto } from './dto/update-salesrep.dto';
export declare class SalesRepsController {
    private readonly salesRepsService;
    constructor(salesRepsService: SalesRepsService);
    create(createSalesRepDto: CreateSalesRepDto): Promise<import("../../database/schemas/salesrep.schema").SalesRep>;
    findAll(companyId?: string): Promise<import("../../database/schemas/salesrep.schema").SalesRep[]>;
    findOne(id: string): Promise<import("../../database/schemas/salesrep.schema").SalesRep>;
    update(id: string, updateSalesRepDto: UpdateSalesRepDto): Promise<import("../../database/schemas/salesrep.schema").SalesRep>;
    remove(id: string): Promise<void>;
}
