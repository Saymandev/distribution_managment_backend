import { Model } from 'mongoose';
import { SalesRep, SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { CreateSalesRepDto } from './dto/create-salesrep.dto';
import { UpdateSalesRepDto } from './dto/update-salesrep.dto';
export declare class SalesRepsService {
    private readonly salesRepModel;
    constructor(salesRepModel: Model<SalesRepDocument>);
    create(dto: CreateSalesRepDto): Promise<SalesRep>;
    findAll(companyId?: string): Promise<SalesRep[]>;
    findOne(id: string): Promise<SalesRep>;
    update(id: string, dto: UpdateSalesRepDto): Promise<SalesRep>;
    remove(id: string): Promise<void>;
}
