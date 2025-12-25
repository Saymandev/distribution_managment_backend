import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../database/schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private readonly customerModel;
    constructor(customerModel: Model<CustomerDocument>);
    create(dto: CreateCustomerDto): Promise<Customer>;
    findAll(): Promise<Customer[]>;
    findOne(id: string): Promise<Customer>;
    update(id: string, dto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
}
