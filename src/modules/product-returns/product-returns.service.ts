import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyClaim, CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { Company, CompanyDocument } from '../../database/schemas/company.schema';
import { ProductReturn, ProductReturnDocument, ReturnStatus, ReturnType } from '../../database/schemas/product-return.schema';
import { Product, ProductDocument } from '../../database/schemas/product.schema';
import { SRIssue, SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
import { CreateProductReturnDto } from './dto/create-product-return.dto';

@Injectable()
export class ProductReturnsService {
  constructor(
    @InjectModel(ProductReturn.name) private readonly productReturnModel: Model<ProductReturnDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(SRIssue.name) private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(SRPayment.name) private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(CompanyClaim.name) private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async create(dto: CreateProductReturnDto): Promise<ProductReturn> {
    // Check if return number exists
    const existing = await this.productReturnModel.findOne({ returnNumber: dto.returnNumber }).exec();
    if (existing) {
      throw new ConflictException('Return number already exists');
    }

    // Validate return type specific fields
    if (dto.returnType === ReturnType.CUSTOMER_RETURN) {
      if (!dto.customerId && !dto.srId && !dto.issueId) {
        throw new BadRequestException('Customer return must have either customerId, srId, or issueId');
      }
      // If issueId is provided, verify the issue exists
      if (dto.issueId) {
        const issue = await this.srIssueModel.findById(dto.issueId).exec();
        if (!issue) {
          throw new NotFoundException(`Issue ${dto.issueId} not found`);
        }
      }
    } else if (dto.returnType === ReturnType.DAMAGE_RETURN) {
      // For damage returns, companyId can be derived from issueId if provided
      // If issueId is provided, we'll get company from the issue's products
      if (!dto.companyId && !dto.issueId) {
        throw new BadRequestException('Damage return must have either companyId or issueId');
      }
      // If issueId is provided, verify the issue exists and get company from it
      if (dto.issueId && !dto.companyId) {
        const issue = await this.srIssueModel.findById(dto.issueId).populate('items.productId').exec();
        if (!issue) {
          throw new NotFoundException(`Issue ${dto.issueId} not found`);
        }
        // Get company from first product in the issue
        if (issue.items && issue.items.length > 0) {
          const firstItem = issue.items[0];
          const productId = typeof firstItem.productId === 'string' 
            ? firstItem.productId 
            : (firstItem.productId as any)?._id;
          const product = await this.productModel.findById(productId).exec();
          if (product) {
            const companyId = typeof product.companyId === 'string' 
              ? product.companyId 
              : (product.companyId as any)?._id;
            dto.companyId = companyId;
          }
        }
      }
    }

    // Verify products exist
    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
    }

    const returnRecord = new this.productReturnModel({
      ...dto,
      status: ReturnStatus.PENDING,
      returnDate: new Date(),
    });

    const saved = await returnRecord.save();

    // Handle stock changes based on return type
    if (dto.returnType === ReturnType.CUSTOMER_RETURN) {
      // Customer return: increase stock (product is back and can be sold)
      // Stock was already decreased when issue was created, so we add it back
      for (const item of dto.items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        }).exec();
      }
    } else if (dto.returnType === ReturnType.DAMAGE_RETURN) {
      // Damage return: DO NOT change stock here
      // Stock was already decreased when the issue was created
      // The damage return just marks it as damaged (not sellable)
      // Stock will be increased back when status changes to RETURNED (company processes/replaces it)
      // No stock change needed here - stock already reflects the products are out
    }

    // If return is linked to an issue, adjust the issue, payment, and claim
    if (dto.issueId) {
      await this.adjustIssueForReturn(dto.issueId, dto.items);
    }

    return saved;
  }

  async findAll(): Promise<ProductReturn[]> {
    return this.productReturnModel
      .find()
      .populate('customerId', 'name code')
      .populate('srId', 'name phone')
      .populate('companyId', 'name code')
      .populate('items.productId', 'name sku')
      .sort({ returnDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ProductReturn> {
    const returnRecord = await this.productReturnModel
      .findById(id)
      .populate('customerId')
      .populate('srId')
      .populate('companyId')
      .populate('items.productId')
      .exec();
    if (!returnRecord) {
      throw new NotFoundException('Product Return not found');
    }
    return returnRecord;
  }

  async updateStatus(id: string, status: ReturnStatus): Promise<ProductReturn> {
    const returnRecord = await this.productReturnModel.findById(id).exec();
    if (!returnRecord) {
      throw new NotFoundException('Product Return not found');
    }

    const previousStatus = returnRecord.status;
    const updated = await this.productReturnModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();

    // Handle stock changes when status changes to RETURNED
    // This means the company has processed the return (replaced or credited)
    if (status === ReturnStatus.RETURNED && previousStatus !== ReturnStatus.RETURNED) {
      if (returnRecord.returnType === ReturnType.DAMAGE_RETURN) {
        // For damage returns, when company processes it, increase stock back
        // (company replaces the damaged product or credits it)
        for (const item of returnRecord.items) {
          const productId = typeof item.productId === 'string' 
            ? item.productId 
            : (item.productId as any)?._id;
          await this.productModel.findByIdAndUpdate(productId, {
            $inc: { stock: item.quantity },
          }).exec();
        }
      }
      // For customer returns, stock was already increased when return was created
      // No additional action needed when status changes to RETURNED
    }

    return updated;
  }

  private async adjustIssueForReturn(issueId: string, returnItems: { productId: string; quantity: number }[]): Promise<void> {
    const issue = await this.srIssueModel.findById(issueId).exec();
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Create a map of returned quantities by product
    const returnedQuantities = new Map<string, number>();
    returnItems.forEach(item => {
      const current = returnedQuantities.get(item.productId) || 0;
      returnedQuantities.set(item.productId, current + item.quantity);
    });

    // Store original total for payment recalculation
    const originalTotal = issue.totalAmount || 0;

    // Adjust issue items - reduce quantities for returned products
    let newTotalAmount = 0;
    const adjustedItems = issue.items.map(issueItem => {
      const productId = typeof issueItem.productId === 'string' 
        ? issueItem.productId 
        : (issueItem.productId as any)?._id;
      
      const returnedQty = returnedQuantities.get(productId) || 0;
      const newQuantity = Math.max(0, issueItem.quantity - returnedQty);
      
      newTotalAmount += newQuantity * issueItem.dealerPrice;

      return {
        productId,
        quantity: newQuantity,
        dealerPrice: issueItem.dealerPrice,
        tradePrice: issueItem.tradePrice,
      };
    });

    // Update issue with adjusted items and new total
    issue.items = adjustedItems;
    issue.totalAmount = newTotalAmount;
    await issue.save();

    // If payment exists for this issue, recalculate it
    const payment = await this.srPaymentModel.findOne({ issueId }).exec();
    if (payment && originalTotal > 0) {
      // Recalculate payment based on new issue amounts
      // IMPORTANT: Keep the payment's totalReceived the same (payment was already made)
      // Only adjust the expected amount and discount
      const originalReceived = payment.totalReceived; // Keep original payment amount
      
      let totalExpected = 0;
      let totalDiscount = 0;

      const paymentItems = adjustedItems.map(issueItem => {
        const expectedItemAmount = issueItem.quantity * issueItem.dealerPrice;
        totalExpected += expectedItemAmount;
        
        return {
          productId: issueItem.productId,
          quantity: issueItem.quantity,
          dealerPrice: issueItem.dealerPrice,
          tradePrice: issueItem.tradePrice, // Keep original trade price
          discount: 0, // Discount will be calculated at payment level
        };
      });

      // Calculate discount at payment level (difference between expected and received)
      totalDiscount = Math.max(0, totalExpected - originalReceived);

      // Calculate trade price per item based on received amount
      const receivedRatio = totalExpected > 0 ? originalReceived / totalExpected : 0;
      const adjustedPaymentItems = paymentItems.map(item => {
        const expectedItemAmount = item.quantity * item.dealerPrice;
        const receivedItemAmount = expectedItemAmount * receivedRatio;
        const tradePricePerUnit = item.quantity > 0 ? receivedItemAmount / item.quantity : 0;
        const itemDiscount = expectedItemAmount - receivedItemAmount;

        return {
          ...item,
          tradePrice: tradePricePerUnit,
          discount: itemDiscount,
        };
      });

      payment.items = adjustedPaymentItems;
      payment.totalExpected = totalExpected;
      payment.totalReceived = originalReceived; // Keep original payment amount
      payment.totalDiscount = totalDiscount;
      await payment.save();

      // Update claim if it exists (find by issueId first, then paymentId)
      let claim = await this.companyClaimModel.findOne({ issueId }).exec();
      if (!claim) {
        claim = await this.companyClaimModel.findOne({ paymentId: payment._id }).exec();
      }
      if (claim) {
        // Get company from first product
        const firstProduct = await this.productModel.findById(adjustedItems[0]?.productId).exec();
        if (firstProduct) {
          const companyId = typeof firstProduct.companyId === 'string' 
            ? firstProduct.companyId 
            : (firstProduct.companyId as any)?._id;
          
          // Get company to get commission rate
          const company = await this.companyModel.findById(companyId).exec();
          
          if (company) {
            const commissionRate = company.commissionRate || 0;

            // Use adjustedPaymentItems (with updated trade prices) to build claim items
            const claimItems = adjustedPaymentItems.map(paymentItem => {
              const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
              const commissionAmount = dealerPriceTotal * (commissionRate / 100);
              const srPayment = paymentItem.quantity * paymentItem.tradePrice;
              const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;

              return {
                productId: paymentItem.productId,
                quantity: paymentItem.quantity,
                dealerPrice: paymentItem.dealerPrice,
                commissionRate,
                commissionAmount,
                srPayment,
                netFromCompany,
              };
            });

            const totalDealerPrice = claimItems.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
            const totalCommission = claimItems.reduce((sum, item) => sum + item.commissionAmount, 0);
            const totalClaim = totalDealerPrice + totalCommission;
            // IMPORTANT: totalSRPayment should equal the actual payment received (not recalculated)
            // This ensures consistency with the payment record
            const totalSRPayment = payment.totalReceived; // Use actual payment received
            const netFromCompany = totalClaim - totalSRPayment;

            claim.items = claimItems;
            claim.totalDealerPrice = totalDealerPrice;
            claim.totalCommission = totalCommission;
            claim.totalClaim = totalClaim;
            claim.totalSRPayment = totalSRPayment;
            claim.netFromCompany = netFromCompany;
            await claim.save();
          }
        }
      }
    }
  }
}

