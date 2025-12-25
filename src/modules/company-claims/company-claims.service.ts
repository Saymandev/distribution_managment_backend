import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyClaim, CompanyClaimDocument, ClaimStatus } from '../../database/schemas/company-claim.schema';
import { Company, CompanyDocument } from '../../database/schemas/company.schema';
import { CreateCompanyClaimDto } from './dto/create-company-claim.dto';

@Injectable()
export class CompanyClaimsService {
  constructor(
    @InjectModel(CompanyClaim.name) private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async create(dto: CreateCompanyClaimDto): Promise<CompanyClaim> {
    // Check if claim number exists
    const existing = await this.companyClaimModel.findOne({ claimNumber: dto.claimNumber }).exec();
    if (existing) {
      throw new ConflictException('Claim number already exists');
    }

    // Verify company exists
    const company = await this.companyModel.findById(dto.companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Calculate totals using the 100/95/6% logic
    let totalDealerPrice = 0;
    let totalCommission = 0;
    let totalSRPayment = 0;

    const items = dto.items.map((item) => {
      const dealerPriceTotal = item.quantity * item.dealerPrice;
      const commissionAmount = dealerPriceTotal * (item.commissionRate / 100);
      const netFromCompany = dealerPriceTotal + commissionAmount - item.srPayment;

      totalDealerPrice += dealerPriceTotal;
      totalCommission += commissionAmount;
      totalSRPayment += item.srPayment;

      return {
        ...item,
        commissionAmount,
        netFromCompany,
      };
    });

    const totalClaim = totalDealerPrice + totalCommission;
    const netFromCompany = totalClaim - totalSRPayment;

    const claim = new this.companyClaimModel({
      claimNumber: dto.claimNumber,
      companyId: dto.companyId,
      paymentId: dto.paymentId,
      items,
      totalDealerPrice,
      totalCommission,
      totalClaim,
      totalSRPayment,
      netFromCompany,
      status: dto.status || ClaimStatus.PENDING,
      notes: dto.notes,
    });

    return claim.save();
  }

  async findAll(): Promise<CompanyClaim[]> {
    return this.companyClaimModel
      .find()
      .populate('companyId', 'name code')
      .populate('paymentId', 'receiptNumber')
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CompanyClaim> {
    const claim = await this.companyClaimModel
      .findById(id)
      .populate('companyId')
      .populate('paymentId')
      .populate('items.productId')
      .exec();
    if (!claim) {
      throw new NotFoundException('Company Claim not found');
    }
    return claim;
  }

  async updateStatus(id: string, status: ClaimStatus, paidDate?: Date): Promise<CompanyClaim> {
    const updateData: any = { status };
    if (status === ClaimStatus.PAID && paidDate) {
      updateData.paidDate = paidDate;
    }
    const updated = await this.companyClaimModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Company Claim not found');
    }
    return updated;
  }

  async findByCompany(companyId: string): Promise<CompanyClaim[]> {
    return this.companyClaimModel
      .find({ companyId })
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 })
      .exec();
  }
}

