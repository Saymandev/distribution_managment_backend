import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Company,
  CompanyDocument,
} from "../../database/schemas/company.schema";
import {
  SupplierPayment,
  SupplierPaymentDocument,
} from "../../database/schemas/sr-payment.schema";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { UpdateSupplierPaymentDto } from "./dto/update-supplier-payment.dto";

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @InjectModel(SupplierPayment.name)
    private readonly supplierPaymentModel: Model<SupplierPaymentDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async generatePaymentNumber(): Promise<string> {
    const lastPayment = await this.supplierPaymentModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastPayment || !lastPayment.paymentNumber) {
      return "SUP-PAY-001";
    }

    const match = lastPayment.paymentNumber.match(/SUP-PAY-(\d+)/);
    if (!match) {
      return "SUP-PAY-001";
    }

    const lastNumber = parseInt(match[1] || "0");
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `SUP-PAY-${nextNumber}`;
  }

  async create(dto: CreateSupplierPaymentDto): Promise<SupplierPayment> {
    // Verify company exists
    const company = await this.companyModel.findById(dto.companyId).exec();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Auto-generate payment number if not provided
    let paymentNumber = dto.paymentNumber;
    if (!paymentNumber) {
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        paymentNumber = await this.generatePaymentNumber();
        const existing = await this.supplierPaymentModel
          .findOne({ paymentNumber })
          .exec();
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
          const match = paymentNumber.match(/SUP-PAY-(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1] || "0");
            const nextNumber = (lastNumber + attempts)
              .toString()
              .padStart(3, "0");
            paymentNumber = `SUP-PAY-${nextNumber}`;
          }
        }
      }
      if (!isUnique) {
        paymentNumber = `SUP-PAY-${Date.now()}`;
      }
    } else {
      // Check if payment number exists
      const existing = await this.supplierPaymentModel
        .findOne({ paymentNumber })
        .exec();
      if (existing) {
        throw new NotFoundException("Payment number already exists");
      }
    }

    const payment = new this.supplierPaymentModel({
      ...dto,
      paymentNumber,
      paymentDate: dto.paymentDate || new Date(),
    });

    return payment.save();
  }

  async findAll(): Promise<SupplierPayment[]> {
    return this.supplierPaymentModel
      .find()
      .populate("companyId", "name code")
      .sort({ paymentDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SupplierPayment> {
    const payment = await this.supplierPaymentModel
      .findById(id)
      .populate("companyId")
      .exec();
    if (!payment) {
      throw new NotFoundException("Supplier payment not found");
    }
    return payment;
  }

  async findByCompany(companyId: string): Promise<SupplierPayment[]> {
    return this.supplierPaymentModel
      .find({ companyId })
      .populate("companyId", "name code")
      .sort({ paymentDate: -1 })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateSupplierPaymentDto,
  ): Promise<SupplierPayment> {
    if (dto.paymentNumber) {
      const existing = await this.supplierPaymentModel
        .findOne({ paymentNumber: dto.paymentNumber, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new NotFoundException("Payment number already exists");
      }
    }

    const updated = await this.supplierPaymentModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Supplier payment not found");
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.supplierPaymentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("Supplier payment not found");
    }
  }

  async findAllWithFilters(filters: {
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { companyId, startDate, endDate, search, page, limit } = filters;

    // Build match conditions
    const matchConditions: any = {};

    if (companyId) {
      try {
        matchConditions.companyId = new Types.ObjectId(companyId);
      } catch (error) {
        // If ObjectId conversion fails, try with string
        matchConditions.companyId = companyId;
      }
    }

    if (startDate || endDate) {
      matchConditions.paymentDate = {};
      if (startDate) {
        // Set to start of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchConditions.paymentDate.$gte = start;
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchConditions.paymentDate.$lte = end;
      }
    }

    if (search) {
      matchConditions.$or = [
        { paymentNumber: { $regex: search, $options: "i" } },
        { paymentMethod: { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.supplierPaymentModel
        .find(matchConditions)
        .populate("companyId", "name code")
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierPaymentModel.countDocuments(matchConditions).exec(),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
