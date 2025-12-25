import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../database/schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerModel.findOne({ code: dto.code }).exec();
    if (existing) {
      throw new ConflictException('Customer with this code already exists');
    }
    const created = new this.customerModel({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return created.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (dto.code) {
      const existing = await this.customerModel.findOne({ code: dto.code, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException('Customer with this code already exists');
      }
    }
    const updated = await this.customerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Customer not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.customerModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Customer not found');
    }
  }
}

