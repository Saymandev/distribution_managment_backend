import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClaimStatus, CompanyClaim, CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { Company, CompanyDocument } from '../../database/schemas/company.schema';
import { Product, ProductDocument } from '../../database/schemas/product.schema';
import { SalesRep, SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssue, SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
import { CreateSRPaymentDto } from './dto/create-sr-payment.dto';
import { UpdateSRPaymentDto } from './dto/update-sr-payment.dto';

@Injectable()
export class SRPaymentsService {
  constructor(
    @InjectModel(SRPayment.name) private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(SalesRep.name) private readonly salesRepModel: Model<SalesRepDocument>,
    @InjectModel(SRIssue.name) private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyClaim.name) private readonly companyClaimModel: Model<CompanyClaimDocument>,
  ) {}

  async generateReceiptNumber(): Promise<string> {
    const lastPayment = await this.srPaymentModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();
    
    if (!lastPayment || !lastPayment.receiptNumber) {
      return 'PAY-001';
    }

    const match = lastPayment.receiptNumber.match(/PAY-(\d+)/);
    if (!match) {
      return 'PAY-001';
    }

    const lastNumber = parseInt(match[1] || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `PAY-${nextNumber}`;
  }

  async generateClaimNumber(): Promise<string> {
    const lastClaim = await this.companyClaimModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();
    
    if (!lastClaim || !lastClaim.claimNumber) {
      return 'CLAIM-001';
    }

    const match = lastClaim.claimNumber.match(/CLAIM-(\d+)/);
    if (!match) {
      return 'CLAIM-001';
    }

    const lastNumber = parseInt(match[1] || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `CLAIM-${nextNumber}`;
  }

  async createClaimFromPayment(payment: SRPaymentDocument): Promise<CompanyClaimDocument> {
    if (!payment.issueId) {
      throw new NotFoundException('Issue ID is required to create a claim');
    }

    // Check if a claim already exists for this issue (one issue = one claim)
    // Convert issueId to ObjectId for proper querying
    let paymentIssueId: string | Types.ObjectId;
    if (typeof payment.issueId === 'string') {
      paymentIssueId = Types.ObjectId.isValid(payment.issueId) 
        ? new Types.ObjectId(payment.issueId) 
        : payment.issueId;
    } else if (payment.issueId && typeof payment.issueId === 'object' && '_id' in payment.issueId) {
      paymentIssueId = (payment.issueId as any)._id;
    } else {
      paymentIssueId = payment.issueId as any;
    }
    
    // Query with both string and ObjectId to catch all cases
    const existingClaimByIssue = await this.companyClaimModel.findOne({ 
      $or: [
        { issueId: paymentIssueId },
        { issueId: String(paymentIssueId) },
        { issueId: new Types.ObjectId(String(paymentIssueId)) }
      ]
    }).exec();
    
    if (existingClaimByIssue) {
      // Update existing claim instead of creating a new one
      return this.updateClaimFromPayment(payment);
    }

    // Also check by paymentId as fallback
    const paymentIdString = String(payment._id);
    const existingClaimByPayment = await this.companyClaimModel.findOne({ 
      $or: [
        { paymentId: paymentIdString },
        { paymentId: payment._id }
      ]
    }).exec();
    
    if (existingClaimByPayment) {
      // Update existing claim instead of creating a new one
      return this.updateClaimFromPayment(payment);
    }

    // Get product IDs from payment items
    const productIds = payment.items.map(item => {
      if (typeof item.productId === 'string') {
        return item.productId;
      } else if (item.productId && typeof item.productId === 'object' && '_id' in item.productId) {
        return (item.productId as any)._id;
      }
      throw new NotFoundException('Invalid product ID in payment items');
    });
    
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
    
    if (products.length === 0) {
      throw new NotFoundException('Products not found');
    }

    // All products should be from the same company (as per business rule)
    const companyId = typeof products[0].companyId === 'string' 
      ? products[0].companyId 
      : (products[0].companyId as any)?._id || products[0].companyId;
    
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Build claim items from payment items
    const claimItems = payment.items.map(paymentItem => {
      const productId = typeof paymentItem.productId === 'string' 
        ? paymentItem.productId 
        : (paymentItem.productId as any)?._id || paymentItem.productId;
      
      const product = products.find(p => p._id.toString() === productId.toString());
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
      const commissionAmount = dealerPriceTotal * (company.commissionRate / 100);
      const srPayment = paymentItem.quantity * paymentItem.tradePrice; // What SR actually paid
      const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;

      return {
        productId,
        quantity: paymentItem.quantity,
        dealerPrice: paymentItem.dealerPrice,
        commissionRate: company.commissionRate,
        commissionAmount,
        srPayment,
        netFromCompany,
      };
    });

    // Calculate totals
    const totalDealerPrice = claimItems.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
    const totalCommission = claimItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    const totalClaim = totalDealerPrice + totalCommission;
    // IMPORTANT: totalSRPayment should equal the actual payment received (not recalculated)
    // This ensures consistency with the payment record
    const totalSRPayment = payment.totalReceived; // Use actual payment received
    const netFromCompany = totalClaim - totalSRPayment;

    // Generate claim number
    const claimNumber = await this.generateClaimNumber();

    // Create the claim
    const claimIssueId = typeof payment.issueId === 'string' 
      ? payment.issueId 
      : (payment.issueId as any)?._id?.toString() || (payment.issueId as any)?._id;
    
    const claim = new this.companyClaimModel({
      claimNumber,
      companyId,
      paymentId: payment._id,
      issueId: claimIssueId, // Link to issue (one issue = one claim)
      items: claimItems,
      totalDealerPrice,
      totalCommission,
      totalClaim,
      totalSRPayment,
      netFromCompany,
      status: ClaimStatus.PENDING,
      notes: `Auto-generated from payment ${payment.receiptNumber}`,
    });

    return claim.save();
  }

  async updateClaimFromPayment(payment: SRPaymentDocument): Promise<CompanyClaimDocument | null> {
    if (!payment.issueId) {
      throw new NotFoundException('Issue ID is required to update a claim');
    }

    // Find existing claim linked to this issue (one issue = one claim)
    // Convert issueId to ObjectId for proper querying
    let updateIssueId: string | Types.ObjectId;
    if (typeof payment.issueId === 'string') {
      updateIssueId = Types.ObjectId.isValid(payment.issueId) 
        ? new Types.ObjectId(payment.issueId) 
        : payment.issueId;
    } else if (payment.issueId && typeof payment.issueId === 'object' && '_id' in payment.issueId) {
      updateIssueId = (payment.issueId as any)._id;
    } else {
      updateIssueId = payment.issueId as any;
    }
    
    // Query with both string and ObjectId to catch all cases
    let existingClaim = await this.companyClaimModel.findOne({ 
      $or: [
        { issueId: updateIssueId },
        { issueId: String(updateIssueId) },
        { issueId: new Types.ObjectId(String(updateIssueId)) }
      ]
    }).exec();
    
    // Fallback: check by paymentId if not found by issueId
    if (!existingClaim) {
      const paymentIdString = String(payment._id);
      existingClaim = await this.companyClaimModel.findOne({ 
        $or: [
          { paymentId: paymentIdString },
          { paymentId: payment._id }
        ]
      }).exec();
    }
    
    if (!existingClaim) {
      // If no claim exists, create one
      return this.createClaimFromPayment(payment);
    }

    // Get product IDs from payment items
    const productIds = payment.items.map(item => {
      if (typeof item.productId === 'string') {
        return item.productId;
      } else if (item.productId && typeof item.productId === 'object' && '_id' in item.productId) {
        return (item.productId as any)._id;
      }
      throw new NotFoundException('Invalid product ID in payment items');
    });
    
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
    
    if (products.length === 0) {
      throw new NotFoundException('Products not found');
    }

    const companyId = typeof products[0].companyId === 'string' 
      ? products[0].companyId 
      : (products[0].companyId as any)?._id || products[0].companyId;
    
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Build claim items from payment items
    const claimItems = payment.items.map(paymentItem => {
      const productId = typeof paymentItem.productId === 'string' 
        ? paymentItem.productId 
        : (paymentItem.productId as any)?._id || paymentItem.productId;
      
      const product = products.find(p => p._id.toString() === productId.toString());
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
      const commissionAmount = dealerPriceTotal * (company.commissionRate / 100);
      const srPayment = paymentItem.quantity * paymentItem.tradePrice;
      const netFromCompany = dealerPriceTotal + commissionAmount - srPayment;

      return {
        productId,
        quantity: paymentItem.quantity,
        dealerPrice: paymentItem.dealerPrice,
        commissionRate: company.commissionRate,
        commissionAmount,
        srPayment,
        netFromCompany,
      };
    });

    // Calculate totals
    const totalDealerPrice = claimItems.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
    const totalCommission = claimItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    const totalClaim = totalDealerPrice + totalCommission;
    // IMPORTANT: totalSRPayment should equal the actual payment received (not recalculated)
    // This ensures consistency with the payment record
    const totalSRPayment = payment.totalReceived; // Use actual payment received
    const netFromCompany = totalClaim - totalSRPayment;

    // Update the claim
    const finalIssueId: string = typeof payment.issueId === 'string' 
      ? payment.issueId 
      : String((payment.issueId as any)?._id || payment.issueId);
    
    existingClaim.items = claimItems;
    existingClaim.totalDealerPrice = totalDealerPrice;
    existingClaim.totalCommission = totalCommission;
    existingClaim.totalClaim = totalClaim;
    existingClaim.totalSRPayment = totalSRPayment;
    existingClaim.netFromCompany = netFromCompany;
    existingClaim.paymentId = String(payment._id); // Update payment reference
    existingClaim.issueId = finalIssueId; // Ensure issueId is set as string
    existingClaim.notes = `Auto-updated from payment ${payment.receiptNumber}`;

    return existingClaim.save();
  }

  async create(dto: CreateSRPaymentDto): Promise<SRPayment> {
    console.log('📥 CREATE PAYMENT - Received DTO:', JSON.stringify(dto, null, 2));
    console.log('📥 CREATE PAYMENT - Issue ID:', dto.issueId);
    console.log('📥 CREATE PAYMENT - SR ID:', dto.srId);
    console.log('📥 CREATE PAYMENT - Items count:', dto.items?.length || 0);
    if (dto.items && dto.items.length > 0) {
      const totalExpected = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
      const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
      console.log('📥 CREATE PAYMENT - Calculated Total Expected:', totalExpected);
      console.log('📥 CREATE PAYMENT - Calculated Total Received:', totalReceived);
      console.log('📥 CREATE PAYMENT - Items details:', dto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        dealerPrice: item.dealerPrice,
        tradePrice: item.tradePrice,
        expected: item.quantity * item.dealerPrice,
        received: item.quantity * item.tradePrice
      })));
    }
    
    // Check if a payment already exists for this issue
    // If yes, update it instead of creating a new one (one issue = one payment record)
    if (dto.issueId) {
      // Convert issueId to string for consistent querying
      const issueIdString = typeof dto.issueId === 'string' ? dto.issueId : String(dto.issueId);
      const existingPayment = await this.srPaymentModel.findOne({ 
        issueId: issueIdString 
      }).exec();
      if (existingPayment) {
        console.log('🔄 UPDATE EXISTING PAYMENT - Existing payment found:', {
          receiptNumber: existingPayment.receiptNumber,
          currentTotalReceived: existingPayment.totalReceived,
          currentTotalExpected: existingPayment.totalExpected
        });
        
        // Frontend sends the CUMULATIVE total amount (not incremental)
        // The frontend calculates: receivedAmount = currentPending (which is the remaining due)
        // So when user enters 300, it means they want to pay the remaining 300
        // We need to calculate: newTotalReceived = existingTotalReceived + newPaymentAmount
        // But the frontend sends tradePrice which gives us the NEW payment amount
        
        // Calculate new payment amount from the provided items
        let newPaymentAmount = 0;
        let totalExpected = 0;
        let totalDiscount = 0;

        const updatedItems = dto.items.map((item) => {
          const expected = item.quantity * item.dealerPrice;
          const received = item.quantity * item.tradePrice;
          const discount = expected - received;

          totalExpected += expected;
          newPaymentAmount += received; // This is the NEW payment amount from this transaction
          totalDiscount += discount;

          return {
            productId: typeof item.productId === 'string' 
              ? item.productId 
              : (item.productId as any)?._id,
            quantity: item.quantity,
            dealerPrice: item.dealerPrice,
            tradePrice: item.tradePrice,
            discount,
          };
        });

        // Calculate CUMULATIVE total: existing + new payment
        // Example: existing = 800, new = 300 → cumulative = 1100
        const cumulativeTotalReceived = (existingPayment.totalReceived || 0) + newPaymentAmount;
        
        console.log('🔄 UPDATE EXISTING PAYMENT - Payment calculation:', {
          previousTotalReceived: existingPayment.totalReceived,
          newPaymentAmount,
          cumulativeTotalReceived,
          totalExpected,
          totalDiscount
        });
        
        // Update existing payment with cumulative totals
        existingPayment.items = updatedItems;
        existingPayment.totalExpected = totalExpected;
        existingPayment.totalReceived = cumulativeTotalReceived; // CUMULATIVE: existing + new
        existingPayment.totalDiscount = totalDiscount;
        existingPayment.paymentMethod = dto.paymentMethod;
        existingPayment.paymentDate = new Date(); // Update payment date
        if (dto.notes) {
          existingPayment.notes = existingPayment.notes 
            ? `${existingPayment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
            : dto.notes;
        }

        const savedPayment = await existingPayment.save();

        // Automatically update claim when payment is updated
        try {
          await this.updateClaimFromPayment(savedPayment);
        } catch (error) {
          console.error('Failed to auto-update claim for payment:', error);
        }

        return savedPayment;
      }
    }

    // No existing payment found, create new one
    // Auto-generate receipt number if not provided
    let receiptNumber = dto.receiptNumber;
    if (!receiptNumber) {
      // Generate receipt number and ensure it's unique
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        receiptNumber = await this.generateReceiptNumber();
        const existing = await this.srPaymentModel.findOne({ receiptNumber }).exec();
        if (!existing) {
          isUnique = true;
        } else {
          // If receipt number exists, increment and try again
          attempts++;
          // Force increment by updating the last payment's receipt number temporarily
          // This ensures we get a unique number
          const match = receiptNumber.match(/PAY-(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1] || '0');
            const nextNumber = (lastNumber + attempts).toString().padStart(3, '0');
            receiptNumber = `PAY-${nextNumber}`;
          }
        }
      }
      if (!isUnique) {
        // Fallback: use timestamp-based receipt number
        receiptNumber = `PAY-${Date.now()}`;
      }
    } else {
      // If receipt number is provided, check if it exists
      const existing = await this.srPaymentModel.findOne({ receiptNumber }).exec();
      if (existing) {
        throw new ConflictException('Receipt number already exists');
      }
    }

    // Verify SR exists
    const sr = await this.salesRepModel.findById(dto.srId).exec();
    if (!sr) {
      throw new NotFoundException('Sales Rep not found');
    }

    // Verify Issue exists and belongs to the SR
    if (dto.issueId) {
      const issue = await this.srIssueModel.findById(dto.issueId).exec();
      if (!issue) {
        throw new NotFoundException('Issue not found');
      }
      
      // Verify issue belongs to the SR
      const issueSrId = typeof issue.srId === 'string' ? issue.srId : (issue.srId as any)?._id?.toString();
      if (issueSrId !== dto.srId) {
        throw new ConflictException('Issue does not belong to the selected Sales Rep');
      }

      // Verify all products in payment items exist in the issue
      const issueProductIds = issue.items.map(item => {
        const productId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id?.toString();
        return productId;
      });

      for (const paymentItem of dto.items) {
        const productId = typeof paymentItem.productId === 'string' ? paymentItem.productId : (paymentItem.productId as any)?._id?.toString();
        
        // Check if product exists in issue
        if (!issueProductIds.includes(productId)) {
          throw new ConflictException(`Product ${productId} is not part of issue ${dto.issueId}`);
        }

        // Check if quantity doesn't exceed issue quantity
        const issueItem = issue.items.find(item => {
          const itemProductId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id?.toString();
          return itemProductId === productId;
        });
        
        if (issueItem && paymentItem.quantity > issueItem.quantity) {
          throw new ConflictException(`Payment quantity (${paymentItem.quantity}) exceeds issue quantity (${issueItem.quantity}) for product ${productId}`);
        }

        // Verify product exists
        const product = await this.productModel.findById(productId).exec();
        if (!product) {
          throw new NotFoundException(`Product ${productId} not found`);
        }
      }

      // Verify total payment amount doesn't exceed issue total (with some tolerance for discounts)
      const issueTotal = issue.totalAmount || 0;
      const paymentTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
      
      // Allow payment to be less than or equal to issue total (discounts are allowed)
      // But payment should not exceed issue total
      if (paymentTotal > issueTotal) {
        throw new ConflictException(`Payment amount (${paymentTotal}) exceeds issue total (${issueTotal})`);
      }

      // Calculate total received amount and validate it doesn't exceed expected amount
      const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
      if (totalReceived > paymentTotal) {
        throw new ConflictException(
          `Received amount (${totalReceived}) cannot exceed expected amount (${paymentTotal}). Overpayment is not allowed.`
        );
      }
    }

    console.log('✨ CREATE NEW PAYMENT - No existing payment found, creating new one');
    
    // Calculate totals
    let totalExpected = 0;
    let totalReceived = 0;
    let totalDiscount = 0;

    const items = dto.items.map((item) => {
      const expected = item.quantity * item.dealerPrice;
      const received = item.quantity * item.tradePrice;
      const discount = expected - received;

      totalExpected += expected;
      totalReceived += received;
      totalDiscount += discount;

      return {
        ...item,
        discount,
      };
    });

    const payment = new this.srPaymentModel({
      receiptNumber,
      srId: dto.srId,
      issueId: dto.issueId,
      items,
      totalExpected,
      totalReceived,
      totalDiscount,
      paymentMethod: dto.paymentMethod,
      paymentDate: new Date(),
      notes: dto.notes,
    });

    const savedPayment = await payment.save();
    
    console.log('✅ PAYMENT SAVED - Final payment:', {
      receiptNumber: savedPayment.receiptNumber,
      totalExpected: savedPayment.totalExpected,
      totalReceived: savedPayment.totalReceived,
      totalDiscount: savedPayment.totalDiscount,
      issueId: savedPayment.issueId
    });

    // Automatically create claim when payment is received
    try {
      await this.createClaimFromPayment(savedPayment);
    } catch (error) {
      // Log error but don't fail payment creation
      console.error('Failed to auto-create claim for payment:', error);
    }

    return savedPayment;
  }

  async findAll(): Promise<any[]> {
    const payments = await this.srPaymentModel
      .find()
      .populate('srId', 'name phone')
      .populate('issueId', 'issueNumber totalAmount')
      .populate('items.productId', 'name sku')
      .sort({ paymentDate: -1 })
      .exec();
    
    // Add due amount to each payment
    return Promise.all(payments.map(async (payment) => {
      const paymentObj = payment.toObject() as any;
      if (payment.issueId) {
        const issueIdString = typeof payment.issueId === 'string' 
          ? payment.issueId 
          : (payment.issueId as any)?._id?.toString() || String(payment.issueId);
        try {
          const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
          paymentObj.totalAmount = totalAmount;
          paymentObj.receivedAmount = receivedAmount;
          paymentObj.due = due;
        } catch (error) {
          // If issue not found, calculate from payment data
          const issue = payment.issueId as any;
          const totalAmount = issue?.totalAmount || payment.totalExpected || 0;
          const receivedAmount = payment.totalReceived || 0;
          paymentObj.totalAmount = totalAmount;
          paymentObj.receivedAmount = receivedAmount;
          paymentObj.due = Math.max(0, totalAmount - receivedAmount);
        }
      } else {
        paymentObj.totalAmount = payment.totalExpected || 0;
        paymentObj.receivedAmount = payment.totalReceived || 0;
        paymentObj.due = Math.max(0, (payment.totalExpected || 0) - (payment.totalReceived || 0));
      }
      return paymentObj;
    }));
  }

  // Calculate due amount for an issue
  // Simple calculation: due = issue.totalAmount - payment.totalReceived
  async calculateDueAmount(issueId: string): Promise<{ totalAmount: number; receivedAmount: number; due: number }> {
    const issue = await this.srIssueModel.findById(issueId).exec();
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const issueIdString = typeof issueId === 'string' ? issueId : String(issueId);
    const payment = await this.srPaymentModel.findOne({ issueId: issueIdString }).exec();
    
    const totalAmount = issue.totalAmount || 0;
    const receivedAmount = payment ? (payment.totalReceived || 0) : 0;
    const due = Math.max(0, totalAmount - receivedAmount);

    return { totalAmount, receivedAmount, due };
  }

  async findOne(id: string): Promise<any> {
    const payment = await this.srPaymentModel
      .findById(id)
      .populate('srId')
      .populate('issueId', 'issueNumber totalAmount')
      .populate('items.productId')
      .exec();
    if (!payment) {
      throw new NotFoundException('SR Payment not found');
    }
    
    const paymentObj = payment.toObject() as any;
    if (payment.issueId) {
      const issueIdString = typeof payment.issueId === 'string' 
        ? payment.issueId 
        : (payment.issueId as any)?._id?.toString() || String(payment.issueId);
      try {
        const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
        paymentObj.totalAmount = totalAmount;
        paymentObj.receivedAmount = receivedAmount;
        paymentObj.due = due;
      } catch (error) {
        // If issue not found, calculate from payment data
        const issue = payment.issueId as any;
        const totalAmount = issue?.totalAmount || payment.totalExpected || 0;
        const receivedAmount = payment.totalReceived || 0;
        paymentObj.totalAmount = totalAmount;
        paymentObj.receivedAmount = receivedAmount;
        paymentObj.due = Math.max(0, totalAmount - receivedAmount);
      }
    } else {
      paymentObj.totalAmount = payment.totalExpected || 0;
      paymentObj.receivedAmount = payment.totalReceived || 0;
      paymentObj.due = Math.max(0, (payment.totalExpected || 0) - (payment.totalReceived || 0));
    }
    return paymentObj;
  }

  async findBySR(srId: string): Promise<SRPayment[]> {
    return this.srPaymentModel
      .find({ srId })
      .populate('items.productId', 'name sku')
      .sort({ paymentDate: -1 })
      .exec();
  }

  async update(id: string, dto: UpdateSRPaymentDto): Promise<SRPayment> {
    console.log('📝 UPDATE PAYMENT - Payment ID:', id);
    console.log('📝 UPDATE PAYMENT - Received DTO:', JSON.stringify(dto, null, 2));
    
    const payment = await this.srPaymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException('SR Payment not found');
    }

    console.log('📝 UPDATE PAYMENT - Current payment:', {
      receiptNumber: payment.receiptNumber,
      currentTotalReceived: payment.totalReceived,
      currentTotalExpected: payment.totalExpected,
      issueId: payment.issueId
    });

    // Prevent editing if payment is fully paid (due = 0)
    // Also validate that new received amount doesn't exceed due amount
    if (payment.issueId) {
      const issueIdString = typeof payment.issueId === 'string' ? payment.issueId : String(payment.issueId);
      const { totalAmount, receivedAmount, due } = await this.calculateDueAmount(issueIdString);
      console.log('📝 UPDATE PAYMENT - Due calculation:', { totalAmount, receivedAmount, due });
      if (due === 0) {
        console.log('❌ UPDATE PAYMENT - Blocked: Payment is fully paid (due = 0)');
        throw new ConflictException('Cannot edit payment: Issue is fully paid (due = 0)');
      }

      // If items are being updated, validate that new received amount doesn't exceed due
      if (dto.items && dto.items.length > 0) {
        // Calculate new total received from the DTO items
        const newTotalReceived = dto.items.reduce((sum, item) => {
          return sum + (item.quantity * item.tradePrice);
        }, 0);

        // The new total received should not exceed issue total
        const maxAllowedReceived = totalAmount; // Can't receive more than issue total
        if (newTotalReceived > maxAllowedReceived) {
          console.log('❌ UPDATE PAYMENT - Blocked: New received amount exceeds issue total');
          throw new ConflictException(
            `Cannot update payment: Received amount (${newTotalReceived}) exceeds issue total (${totalAmount}). Maximum allowed: ${totalAmount}`
          );
        }

        // When editing, the new received amount should not exceed: current received + due
        // This ensures the user can't enter more than what's still due
        const currentReceived = receivedAmount;
        const maxAllowedForEdit = currentReceived + due; // Current received + remaining due
        if (newTotalReceived > maxAllowedForEdit) {
          console.log('❌ UPDATE PAYMENT - Blocked: New received amount exceeds due amount');
          throw new ConflictException(
            `Cannot update payment: Received amount (${newTotalReceived}) cannot exceed ${maxAllowedForEdit}. Current received: ${currentReceived}, Due: ${due}`
          );
        }
      }
    }

    // If items are being updated, validate them
    if (dto.items && dto.items.length > 0) {
      // Verify Issue exists if issueId is provided or use existing payment's issueId
      const issueId = dto.issueId || payment.issueId;
      if (issueId) {
        const issueIdString = typeof issueId === 'string' ? issueId : String(issueId);
        const issue = await this.srIssueModel.findById(issueIdString).exec();
        if (!issue) {
          throw new NotFoundException('Issue not found');
        }

        // Verify SR exists if srId is provided or use existing payment's srId
        const srId = dto.srId || payment.srId;
        const srIdString = typeof srId === 'string' ? srId : String(srId);
        
        // Verify issue belongs to the SR
        const issueSrId = typeof issue.srId === 'string' ? issue.srId : (issue.srId as any)?._id?.toString();
        if (issueSrId !== srIdString) {
          throw new ConflictException('Issue does not belong to the selected Sales Rep');
        }

        // Verify all products in payment items exist in the issue
        const issueProductIds = issue.items.map(item => {
          const productId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id?.toString();
          return productId;
        });

        for (const paymentItem of dto.items) {
          const productId = typeof paymentItem.productId === 'string' ? paymentItem.productId : (paymentItem.productId as any)?._id?.toString();
          
          // Check if product exists in issue
          if (!issueProductIds.includes(productId)) {
            throw new ConflictException(`Product ${productId} is not part of issue ${issueIdString}`);
          }

          // Check if quantity doesn't exceed issue quantity
          const issueItem = issue.items.find(item => {
            const itemProductId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id?.toString();
            return itemProductId === productId;
          });
          
          if (issueItem && paymentItem.quantity > issueItem.quantity) {
            throw new ConflictException(`Payment quantity (${paymentItem.quantity}) exceeds issue quantity (${issueItem.quantity}) for product ${productId}`);
          }

          // Verify product exists
          const product = await this.productModel.findById(productId).exec();
          if (!product) {
            throw new NotFoundException(`Product ${productId} not found`);
          }
        }

        // Verify total payment amount doesn't exceed issue total
        const issueTotal = issue.totalAmount || 0;
        const paymentTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.dealerPrice), 0);
        
        if (paymentTotal > issueTotal) {
          throw new ConflictException(`Payment amount (${paymentTotal}) exceeds issue total (${issueTotal})`);
        }

        // Calculate total received amount and validate it doesn't exceed expected amount
        const totalReceived = dto.items.reduce((sum, item) => sum + (item.quantity * item.tradePrice), 0);
        if (totalReceived > paymentTotal) {
          throw new ConflictException(
            `Received amount (${totalReceived}) cannot exceed expected amount (${paymentTotal}). Overpayment is not allowed.`
          );
        }
      }

      // Recalculate totals
      let totalExpected = 0;
      let totalReceived = 0;
      let totalDiscount = 0;

      const items = dto.items.map((item) => {
        const expected = item.quantity * item.dealerPrice;
        const received = item.quantity * item.tradePrice;
        const discount = expected - received;

        totalExpected += expected;
        totalReceived += received;
        totalDiscount += discount;

        return {
          ...item,
          discount,
        };
      });

      const updateData: any = {
        ...dto,
        items,
        totalExpected,
        totalReceived,
        totalDiscount,
      };

      console.log('📝 UPDATE PAYMENT - Update data:', {
        totalExpected,
        totalReceived,
        totalDiscount,
        itemsCount: items.length
      });

      const updated = await this.srPaymentModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .populate('srId', 'name phone')
        .populate('issueId', 'issueNumber')
        .populate('items.productId', 'name sku')
        .exec();

      console.log('✅ UPDATE PAYMENT - Payment updated:', {
        receiptNumber: updated.receiptNumber,
        newTotalReceived: updated.totalReceived,
        newTotalExpected: updated.totalExpected
      });

      // Automatically update claim when payment is updated
      try {
        await this.updateClaimFromPayment(updated);
      } catch (error) {
        // Log error but don't fail payment update
        console.error('Failed to auto-update claim for payment:', error);
      }

      return updated;
    } else {
      // Update other fields without recalculating
      const updated = await this.srPaymentModel
        .findByIdAndUpdate(id, { $set: dto }, { new: true })
        .populate('srId', 'name phone')
        .populate('issueId', 'issueNumber')
        .populate('items.productId', 'name sku')
        .exec();

      // If payment method or notes changed, we don't need to update claim
      // Only update claim if items were actually modified (which is handled above)
      // So we skip claim update here

      return updated;
    }
  }

  async remove(id: string): Promise<void> {
    // Find and delete associated claim first
    const claim = await this.companyClaimModel.findOne({ paymentId: id }).exec();
    if (claim) {
      await this.companyClaimModel.findByIdAndDelete(claim._id).exec();
    }

    const res = await this.srPaymentModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('SR Payment not found');
    }
  }
}

