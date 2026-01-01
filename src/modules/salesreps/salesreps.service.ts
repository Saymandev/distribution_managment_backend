import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  SalesRep,
  SalesRepDocument,
} from "../../database/schemas/salesrep.schema";
import { CreateSalesRepDto } from "./dto/create-salesrep.dto";
import { UpdateSalesRepDto } from "./dto/update-salesrep.dto";

@Injectable()
export class SalesRepsService {
  constructor(
    @InjectModel(SalesRep.name)
    private readonly salesRepModel: Model<SalesRepDocument>,
  ) {}

  async create(dto: CreateSalesRepDto): Promise<SalesRep> {
    const created = new this.salesRepModel({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return created.save();
  }

  async findAll(companyId?: string): Promise<SalesRep[]> {
    const query = companyId ? { companyId } : {};
    return this.salesRepModel
      .find(query)
      .populate("companyId", "name code")
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SalesRep> {
    const salesRep = await this.salesRepModel.findById(id).exec();
    if (!salesRep) {
      throw new NotFoundException("Sales Rep not found");
    }
    return salesRep;
  }

  async update(id: string, dto: UpdateSalesRepDto): Promise<SalesRep> {
    const updated = await this.salesRepModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Sales Rep not found");
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.salesRepModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Sales Rep not found");
    }
  }
}
