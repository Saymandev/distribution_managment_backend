import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../../database/schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companyModel.findOne({ code: dto.code }).exec();
    if (existing) {
      throw new ConflictException('Company with this code already exists');
    }
    const created = new this.companyModel(dto);
    return created.save();
  }

  async findAll(): Promise<Company[]> {
    return this.companyModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const updated = await this.companyModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Company not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.companyModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Company not found');
    }
  }
}