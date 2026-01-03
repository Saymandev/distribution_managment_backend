import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ClaimStatus,
  CompanyClaim,
  CompanyClaimDocument,
} from "../../database/schemas/company-claim.schema";
import {
  Company,
  CompanyDocument,
} from "../../database/schemas/company.schema";
import {
  ProductReturn,
  ProductReturnDocument,
  ReturnType,
} from "../../database/schemas/product-return.schema";
import {
  Product,
  ProductDocument,
} from "../../database/schemas/product.schema";
import {
  SalesRep,
  SalesRepDocument,
} from "../../database/schemas/salesrep.schema";
import {
  SRIssue,
  SRIssueDocument,
} from "../../database/schemas/sr-issue.schema";
import {
  SRPayment,
  SRPaymentDocument,
} from "../../database/schemas/sr-payment.schema";
import { ProductReturnsService } from "../product-returns/product-returns.service";
import { CreateSRPaymentDto } from "./dto/create-sr-payment.dto";
import { UpdateSRPaymentDto } from "./dto/update-sr-payment.dto";

@Injectable()
export class SRPaymentsService {
  constructor(
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(SalesRep.name)
    private readonly salesRepModel: Model<SalesRepDocument>,
    @InjectModel(SRIssue.name)
    private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(ProductReturn.name)
    private readonly productReturnModel: Model<ProductReturnDocument>,
    private readonly productReturnsService: ProductReturnsService,
  ) {}

  async generateReceiptNumber(): Promise<string> {
    const lastPayment = await this.srPaymentModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastPayment || !lastPayment.receiptNumber) {
      return "PAY-001";
    }

    const match = lastPayment.receiptNumber.match(/PAY-(\d+)/);
    if (!match) {
      return "PAY-001";
    }

    const lastNumber = parseInt(match[1] || "0");
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `PAY-${nextNumber}`;
  }

  async generateClaimNumber(): Promise<string> {
    const lastClaim = await this.companyClaimModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastClaim || !lastClaim.claimNumber) {
      return "CLAIM-001";
    }

    const match = lastClaim.claimNumber.match(/CLAIM-(\d+)/);
    if (!match) {
      return "CLAIM-001";
    }

    const lastNumber = parseInt(match[1] || "0");
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `CLAIM-${nextNumber}`;
  }

  async createClaimFromPayment(
    payment: SRPaymentDocument,
  ): Promise<CompanyClaimDocument> {
    if (
      !payment.issueId ||
      !payment.companyClaim ||
      payment.companyClaim <= 0
    ) {
      throw new NotFoundException(
        "Issue ID and company claim amount are required to create a claim",
      );
    }

    // Check if a claim already exists for this issue (one issue = one claim)
    // Convert issueId to ObjectId for proper querying
    let paymentIssueId: string | Types.ObjectId;
    if (typeof payment.issueId === "string") {
      paymentIssueId = Types.ObjectId.isValid(payment.issueId)
        ? new Types.ObjectId(payment.issueId)
        : payment.issueId;
    } else if (
      payment.issueId &&
      typeof payment.issueId === "object" &&
      "_id" in payment.issueId
    ) {
      paymentIssueId = (payment.issueId as any)._id;
    } else {
      paymentIssueId = payment.issueId as any;
    }

    // Query with both string and ObjectId to catch all cases
    const existingClaimByIssue = await this.companyClaimModel
      .findOne({
        $or: [
          { issueId: paymentIssueId },
          { issueId: String(paymentIssueId) },
          { issueId: new Types.ObjectId(String(paymentIssueId)) },
        ],
      })
      .exec();

    if (existingClaimByIssue) {
      // Update existing claim instead of creating a new one
      return this.updateClaimFromPayment(payment);
    }

    // Also check by paymentId as fallback
    const paymentIdString = String(payment._id);
    const existingClaimByPayment = await this.companyClaimModel
      .findOne({
        $or: [{ paymentId: paymentIdString }, { paymentId: payment._id }],
      })
      .exec();

    if (existingClaimByPayment) {
      // Update existing claim instead of creating a new one
      return this.updateClaimFromPayment(payment);
    }

    // Get product IDs from payment items to find the company
    const productIds = payment.items.map((item) => {
      if (typeof item.productId === "string") {
        return item.productId;
      } else if (
        item.productId &&
        typeof item.productId === "object" &&
        "_id" in item.productId
      ) {
        return (item.productId as any)._id;
      }
      throw new NotFoundException("Invalid product ID in payment items");
    });

    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .exec();

    if (products.length === 0) {
      throw new NotFoundException("Products not found");
    }

    // All products should be from the same company (as per business rule)
    const companyId =
      typeof products[0].companyId === "string"
        ? products[0].companyId
        : (products[0].companyId as any)?._id || products[0].companyId;

    // Generate claim number
    const claimNumber = await this.generateClaimNumber();

    // Create the claim
    const claimIssueId =
      typeof payment.issueId === "string"
        ? payment.issueId
        : (payment.issueId as any)?._id?.toString() ||
          (payment.issueId as any)?._id;

    const claim = new this.companyClaimModel({
      claimNumber,
      companyId,
      paymentId: payment._id,
      issueId: claimIssueId, // Link to issue (one issue = one claim)
      items: [], // No complex items needed
      totalDealerPrice: 0, // Not needed for simple claims
      totalCompanyClaim: payment.companyClaim, // Just use the amount entered in payment
      totalSRPayment: 0, // Not needed for simple claims
      netFromCompany: payment.companyClaim, // Just use the amount entered in payment
      status: ClaimStatus.PENDING,
      notes: `Auto-generated from payment ${payment.receiptNumber}`,
    });

    return claim.save();
  }

  async updateClaimFromPayment(
    payment: SRPaymentDocument,
  ): Promise<CompanyClaimDocument | null> {
    if (!payment.issueId) {
      throw new NotFoundException("Issue ID is required to update a claim");
    }

    // Find existing claim linked to this issue (one issue = one claim)
    // Convert issueId to ObjectId for proper querying
    let updateIssueId: string | Types.ObjectId;
    if (typeof payment.issueId === "string") {
      updateIssueId = Types.ObjectId.isValid(payment.issueId)
        ? new Types.ObjectId(payment.issueId)
        : payment.issueId;
    } else if (
      payment.issueId &&
      typeof payment.issueId === "object" &&
      "_id" in payment.issueId
    ) {
      updateIssueId = (payment.issueId as any)._id;
    } else {
      updateIssueId = payment.issueId as any;
    }

    // Query with both string and ObjectId to catch all cases
    let existingClaim = await this.companyClaimModel
      .findOne({
        $or: [
          { issueId: updateIssueId },
          { issueId: String(updateIssueId) },
          { issueId: new Types.ObjectId(String(updateIssueId)) },
        ],
      })
      .exec();

    // Fallback: check by paymentId if not found by issueId
    if (!existingClaim) {
      const paymentIdString = String(payment._id);
      existingClaim = await this.companyClaimModel
        .findOne({
          $or: [{ paymentId: paymentIdString }, { paymentId: payment._id }],
        })
        .exec();
    }

    if (!existingClaim) {
      // If no claim exists, create one
      return this.createClaimFromPayment(payment);
    }

    // Get product IDs from payment items
    const productIds = payment.items.map((item) => {
      if (typeof item.productId === "string") {
        return item.productId;
      } else if (
        item.productId &&
        typeof item.productId === "object" &&
        "_id" in item.productId
      ) {
        return (item.productId as any)._id;
      }
      throw new NotFoundException("Invalid product ID in payment items");
    });

    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .exec();

    if (products.length === 0) {
      throw new NotFoundException("Products not found");
    }

    const companyId =
      typeof products[0].companyId === "string"
        ? products[0].companyId
        : (products[0].companyId as any)?._id || products[0].companyId;

    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Build claim items from payment items
    const claimItems = payment.items.map((paymentItem) => {
      const productId =
        typeof paymentItem.productId === "string"
          ? paymentItem.productId
          : (paymentItem.productId as any)?._id || paymentItem.productId;

      const product = products.find(
        (p) => p._id.toString() === productId.toString(),
      );
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const dealerPriceTotal = paymentItem.quantity * paymentItem.dealerPrice;
      const discount =
        paymentItem.quantity *
        (paymentItem.dealerPrice - paymentItem.tradePrice); // Discount given to customer
      const commissionAmount =
        dealerPriceTotal * (company.commissionRate / 100); // Use company's commission rate
      const srPayment = paymentItem.quantity * paymentItem.tradePrice;
      const netFromCompany = dealerPriceTotal + commissionAmount - srPayment; // Dealer price + commission - SR payment

      return {
        productId,
        quantity: paymentItem.quantity,
        dealerPrice: paymentItem.dealerPrice,
        tradePrice: paymentItem.tradePrice,
        discount,
        commissionRate: company.commissionRate,
        commissionAmount,
        srPayment,
        netFromCompany,
      };
    });

    // Calculate totals
    const totalDealerPrice = claimItems.reduce(
      (sum, item) => sum + item.quantity * item.dealerPrice,
      0,
    );
    const totalCommission = claimItems.reduce(
      (sum, item) => sum + item.commissionAmount,
      0,
    );
    const totalSRPayment = claimItems.reduce(
      (sum, item) => sum + item.srPayment,
      0,
    ); // What SR actually paid
    const totalCompanyClaim = totalDealerPrice + totalCommission; // Dealer price + commission
    const netFromCompany = totalCompanyClaim - totalSRPayment; // Amount to claim from company

    // Update the claim
    const finalIssueId: string =
      typeof payment.issueId === "string"
        ? payment.issueId
        : String((payment.issueId as any)?._id || payment.issueId);

    existingClaim.items = []; // No complex items needed
    existingClaim.totalDealerPrice = 0; // Not needed for simple claims
    existingClaim.totalCompanyClaim = payment.companyClaim; // Just use the amount entered in payment
    existingClaim.totalSRPayment = 0; // Not needed for simple claims
    existingClaim.netFromCompany = payment.companyClaim; // Just use the amount entered in payment
    existingClaim.companyId = companyId; // Ensure companyId is set
    existingClaim.paymentId = String(payment._id); // Update payment reference
    existingClaim.issueId = finalIssueId; // Ensure issueId is set as string
    existingClaim.notes = `Auto-updated from payment ${payment.receiptNumber}`;

    return existingClaim.save();
  }

  async create(dto: CreateSRPaymentDto): Promise<SRPayment> {
    // Process returns FIRST before creating payment
    let damageReturnId: string | null = null;
    let customerReturnId: string | null = null;

    if (dto.returnItems && dto.returnItems.length > 0 && dto.issueId) {
      try {
        // Separate damaged and customer return items
        const damagedItems = dto.returnItems
          .filter((item) => item.damagedQuantity > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: item.damagedQuantity,
            reason: item.reason || "damage product",
          }));

        const customerReturnItems = dto.returnItems
          .filter((item) => item.customerReturnQuantity > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: item.customerReturnQuantity,
            reason: item.reason || undefined,
          }));

        // Create damage return if there are damaged items
        if (damagedItems.length > 0) {
          const totalDamagedQty = damagedItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const damageReturnDto = {
            returnNumber: `DAMAGE-RET-${Date.now()}`,
            returnType: ReturnType.DAMAGE_RETURN,
            srId: dto.srId,
            issueId: dto.issueId,
            items: damagedItems,
            notes: `Damage return processed with payment. Total ${totalDamagedQty} damaged product(s).`,
          };
          const createdDamageReturn =
            await this.productReturnsService.create(damageReturnDto);
          damageReturnId = (createdDamageReturn as any)._id.toString();
        }

        // Create customer return if there are customer return items
        if (customerReturnItems.length > 0) {
          const totalCustomerReturnQty = customerReturnItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const customerReturnDto = {
            returnNumber: `CUSTOMER-RET-${Date.now() + 1}`,
            returnType: ReturnType.CUSTOMER_RETURN,
            srId: dto.srId,
            issueId: dto.issueId,
            items: customerReturnItems,
            notes: `Customer return processed with payment. Total ${totalCustomerReturnQty} product(s) returned.`,
          };
          const createdCustomerReturn =
            await this.productReturnsService.create(customerReturnDto);
          customerReturnId = (createdCustomerReturn as any)._id.toString();
        }
      } catch (error) {
        console.error("Return processing failed in payment creation:", error);
        // Continue with payment creation even if returns fail
      }
    }

    // Explicitly set receiptNumber to undefined if it's an empty string or null
    if (
      dto.receiptNumber === null ||
      (dto.receiptNumber !== undefined && dto.receiptNumber.trim() === "")
    ) {
      dto.receiptNumber = undefined;
    }

    if (dto.items && dto.items.length > 0) {
      // These `totalExpected`, `totalReceived`, and `items` variables are local to this `if` block.
      // The actual values for the new payment are calculated below.
      const totalExpected = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.tradePrice,
        0,
      );
      const totalReceived = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.tradePrice,
        0,
      );
      const items = dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        dealerPrice: item.dealerPrice,
        tradePrice: item.tradePrice,
        expected: item.quantity * item.tradePrice,
        received: item.quantity * item.tradePrice,
      }));
    }

    // Check if a payment already exists for this issue
    // If yes, update it instead of creating a new one (one issue = one payment record)
    if (dto.issueId) {
      // Convert issueId to string for consistent querying
      const issueIdString =
        typeof dto.issueId === "string" ? dto.issueId : String(dto.issueId);
      const existingPayment = await this.srPaymentModel
        .findOne({
          issueId: issueIdString,
        })
        .exec();
      if (existingPayment) {
        // Frontend sends the CUMULATIVE total amount (not incremental)
        // The frontend calculates: receivedAmount = currentPending (which is the remaining due)
        // So when user enters 300, it means they want to pay the remaining 300
        // We need to calculate: newTotalReceived = existingTotalReceived + newPaymentAmount

        let totalExpectedFromDto = 0;
        let totalDiscountFromDto = 0;

        const processedItems = dto.items.map((item) => {
          const expected = item.quantity * item.dealerPrice;
          const received = item.quantity * item.tradePrice;
          const discount = expected - received;

          totalExpectedFromDto += expected;
          totalDiscountFromDto += discount;

          return {
            productId:
              typeof item.productId === "string"
                ? item.productId
                : (item.productId as any)?._id,
            quantity: item.quantity,
            dealerPrice: item.dealerPrice,
            tradePrice: item.tradePrice,
            discount,
          };
        });

        // Update existing payment with cumulative totals
        existingPayment.items = processedItems;
        // totalExpected should remain as original expected amount, don't change it
        existingPayment.totalReceived =
          (existingPayment.totalReceived || 0) + (dto.receivedAmount || 0); // Add current payment to cumulative
        existingPayment.totalDiscount = totalDiscountFromDto;
        existingPayment.receivedAmount =
          (existingPayment.receivedAmount || 0) + (dto.receivedAmount || 0); // Add current payment to cumulative
        existingPayment.paymentMethod = dto.paymentMethod;
        existingPayment.paymentDate = new Date(); // Update payment date

        // Update customer due and company claim from frontend
        if (dto.companyClaim !== undefined) {
          existingPayment.companyClaim = dto.companyClaim;
        }
        if (dto.customerInfo !== undefined) {
          existingPayment.customerInfo = dto.customerInfo;
        }
        if (dto.customerDue !== undefined) {
          // Update customerDue for existing payment
          existingPayment.customerDue = dto.customerDue;
        }

        if (dto.notes) {
          existingPayment.notes = existingPayment.notes
            ? `${existingPayment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
            : dto.notes;
        }

        const savedPayment = await existingPayment.save();

        // Automatically update claim when payment is updated
        if (savedPayment.companyClaim && savedPayment.companyClaim > 0) {
          try {
            await this.updateClaimFromPayment(savedPayment);
          } catch (error) {
            console.error("Failed to auto-update claim for payment:", error);
          }
        }

        return savedPayment;
      }
    }

    // No existing payment found, create new one
    // Auto-generate receipt number if not provided
    let receiptNumber = dto.receiptNumber;
    if (!receiptNumber || receiptNumber.trim() === "") {
      // Generate receipt number and ensure it's unique
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        receiptNumber = await this.generateReceiptNumber();
        const existing = await this.srPaymentModel
          .findOne({ receiptNumber })
          .exec();
        if (!existing) {
          isUnique = true;
        } else {
          // If receipt number exists, increment and try again
          attempts++;
          // Force increment by updating the last payment's receipt number temporarily
          // This ensures we get a unique number
          const match = receiptNumber.match(/PAY-(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1] || "0");
            const nextNumber = (lastNumber + attempts)
              .toString()
              .padStart(3, "0");
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
      const existing = await this.srPaymentModel
        .findOne({ receiptNumber })
        .exec();
      if (existing) {
        throw new ConflictException("Receipt number already exists");
      }
    }

    // Calculate totals for the new payment
    let totalExpected = 0;
    let totalReceived = 0;
    let totalDiscount = 0;

    const items = dto.items.map((item) => {
      const expected = item.quantity * item.tradePrice;
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
      receiptNumber: receiptNumber, // Use the generated receiptNumber
      srId: dto.srId,
      issueId: dto.issueId,
      items,
      totalExpected,
      totalReceived,
      totalDiscount,
      paymentMethod: dto.paymentMethod,
      paymentDate: new Date(),
      receivedAmount: dto.receivedAmount || 0,
      companyClaim: dto.companyClaim || 0,
      customerInfo: dto.customerInfo,
      customerDue: dto.customerDue || 0,
      notes:
        dto.notes +
        (damageReturnId || customerReturnId ? " (Includes returns)" : ""),
    });
    const savedPayment = await payment.save();

    // Automatically create claim based on company's commission rate
    try {
      await this.createClaimFromPayment(savedPayment);
    } catch (error) {
      // Log error but don't fail payment creation
      console.error("Failed to auto-create claim for payment:", error);
    }

    return savedPayment;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: any[]; pagination: any }> {
    const { payments } = await this.getOptimized();
    const totalItems = payments.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      payments: payments.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getOptimized(companyId?: string): Promise<any> {
    // Fetch all necessary data in bulk
    const [payments, issues, products, salesReps, returns, claims, companies] =
      await Promise.all([
        this.srPaymentModel
          .find()
          .populate("srId")
          .populate("issueId")
          .populate("items.productId")
          .sort({ paymentDate: -1, createdAt: -1 }) // Sort payments by paymentDate (newest first), then by createdAt (newest first)
          .exec(),
        this.srIssueModel
          .find()
          .populate("srId")
          .populate("items.productId")
          .exec(),
        this.productModel.find().populate("companyId").exec(),
        this.salesRepModel.find().populate("companyId").exec(),
        this.productReturnModel
          .find()
          .populate("srId")
          .populate("issueId")
          .populate("items.productId")
          .exec(),
        this.companyClaimModel
          .find()
          .populate("companyId")
          .populate("issueId")
          .populate("paymentId")
          .exec(),
        this.companyModel.find().exec(),
      ]);

    let filteredProducts = products;
    let filteredSalesReps = salesReps;
    let filteredIssues = issues;
    let filteredPayments = payments;
    let filteredReturns = returns;
    let filteredClaims = claims;

    const getCompanyIdString = (obj: any): string | undefined => {
      if (!obj || !obj.companyId) return undefined;
      return typeof obj.companyId === "string"
        ? obj.companyId
        : String(obj.companyId._id);
    };

    if (companyId) {
      filteredProducts = products.filter(
        (p) => getCompanyIdString(p) === companyId,
      );
      filteredSalesReps = salesReps.filter(
        (sr) => getCompanyIdString(sr) === companyId,
      );

      const companyProductIds = filteredProducts.map((p) => String(p._id));

      filteredIssues = issues.filter((issue) =>
        issue.items.some((item) =>
          companyProductIds.includes(
            String((item.productId as any)?._id || item.productId),
          ),
        ),
      );

      const filteredIssueIds = filteredIssues.map((issue) => String(issue._id));

      filteredPayments = payments.filter((payment) =>
        filteredIssueIds.includes(
          String((payment.issueId as any)?._id || payment.issueId),
        ),
      );

      filteredReturns = returns.filter((ret) =>
        filteredIssueIds.includes(
          String((ret.issueId as any)?._id || ret.issueId),
        ),
      );

      filteredClaims = claims.filter(
        (claim) => getCompanyIdString(claim) === companyId,
      );
    }

    // --- Optimized In-Memory Due Calculation ---
    const dueAmounts: Record<
      string,
      { totalAmount: number; receivedAmount: number; due: number }
    > = {};

    // Map to store total received for each issue
    const issueReceivedMap: Record<string, number> = {};
    filteredPayments.forEach((payment) => {
      const issueId =
        typeof payment.issueId === "string"
          ? payment.issueId
          : String((payment.issueId as any)?._id || payment.issueId);
      issueReceivedMap[issueId] =
        (issueReceivedMap[issueId] || 0) + (payment.receivedAmount || 0);
    });

    // Map to store total return value for each issue
    const issueReturnMap: Record<string, number> = {};
    filteredReturns.forEach((returnDoc) => {
      const issueId =
        typeof returnDoc.issueId === "string"
          ? returnDoc.issueId
          : String((returnDoc.issueId as any)?._id || returnDoc.issueId);
      let totalReturnValue = 0;
      returnDoc.items.forEach((returnItem) => {
        // Ensure product is populated or fetched
        const product = filteredProducts.find(
          (p) => String(p._id) === String(returnItem.productId),
        );
        if (product) {
          totalReturnValue += returnItem.quantity * product.tradePrice;
        }
      });
      issueReturnMap[issueId] =
        (issueReturnMap[issueId] || 0) + totalReturnValue;
    });

    // Map to store total company claim and customer due values for each issue
    // Only include unpaid claims and outstanding customer dues
    const issueClaimMap: Record<string, number> = {};
    const issueCustomerDueMap: Record<string, number> = {};

    filteredPayments.forEach((payment) => {
      const issueId =
        typeof payment.issueId === "string"
          ? payment.issueId
          : String((payment.issueId as any)?._id || payment.issueId);

      // Only include customer dues that haven't been settled (customerDue > 0 means outstanding)
      if (payment.customerDue && payment.customerDue > 0) {
        issueCustomerDueMap[issueId] =
          (issueCustomerDueMap[issueId] || 0) + payment.customerDue;
      }

      // For company claims, check if the corresponding claim is still unpaid
      if (payment.companyClaim && payment.companyClaim > 0) {
        // Find if there's a corresponding claim for this payment that's still pending
        const relatedClaim = filteredClaims.find((claim) => {
          const claimPaymentId =
            typeof claim.paymentId === "string"
              ? claim.paymentId
              : String((claim.paymentId as any)?._id || claim.paymentId);
          const paymentId = String(payment._id);
          return claimPaymentId === paymentId && claim.status !== "paid";
        });

        // Only include company claims that haven't been paid yet
        if (relatedClaim) {
          issueClaimMap[issueId] =
            (issueClaimMap[issueId] || 0) + payment.companyClaim;
        }
      }
    });

    for (const issue of filteredIssues) {
      const issueIdString = String(issue._id);
      let adjustedTotalAmount = issue.totalAmount || 0;

      // Subtract return values from total amount
      adjustedTotalAmount = Math.max(
        0,
        adjustedTotalAmount - (issueReturnMap[issueIdString] || 0),
      );

      const receivedAmount = issueReceivedMap[issueIdString] || 0;
      const totalCompanyClaims = issueClaimMap[issueIdString] || 0;
      const totalCustomerDues = issueCustomerDueMap[issueIdString] || 0;

      // Due calculation: If there are payments with customer dues or company claims,
      // include both as due amounts. Otherwise use traditional calculation.
      const hasPaymentsWithDues =
        totalCustomerDues > 0 || totalCompanyClaims > 0;
      const due = hasPaymentsWithDues
        ? totalCustomerDues + totalCompanyClaims
        : Math.max(0, adjustedTotalAmount - receivedAmount);

      dueAmounts[issueIdString] = {
        totalAmount: adjustedTotalAmount,
        receivedAmount,
        due,
      };
    }

    for (const payment of filteredPayments) {
      if (payment.issueId) {
        const issueIdString =
          typeof payment.issueId === "string"
            ? payment.issueId
            : String((payment.issueId as any)?._id || payment.issueId);
        const calculatedDue = dueAmounts[issueIdString];
        if (calculatedDue) {
          (payment as any).calculatedTotalAmount = calculatedDue.totalAmount;
          (payment as any).calculatedReceivedAmount =
            calculatedDue.receivedAmount;
          (payment as any).calculatedDue = calculatedDue.due;
          (payment as any).customerDue = payment.customerDue || 0;
        } else {
          // Fallback if somehow dueAmounts didn't contain this issue (should not happen with current logic)
          (payment as any).calculatedTotalAmount = payment.totalExpected || 0;
          (payment as any).calculatedReceivedAmount =
            payment.receivedAmount || 0;
          (payment as any).calculatedDue = Math.max(
            0,
            (payment.totalExpected || 0) - (payment.receivedAmount || 0),
          );
        }
      } else {
        (payment as any).calculatedTotalAmount = payment.totalExpected || 0;
        (payment as any).calculatedReceivedAmount = payment.receivedAmount || 0;
        (payment as any).calculatedDue = Math.max(
          0,
          (payment.totalExpected || 0) - (payment.receivedAmount || 0),
        );
      }
    }

    // Ensure the final filteredPayments array is sorted from new to old
    filteredPayments.sort((a, b) => {
      const dateA = new Date(a.paymentDate || (a as any).createdAt).getTime();
      const dateB = new Date(b.paymentDate || (b as any).createdAt).getTime();
      return dateB - dateA; // Sort descending (newest first)
    });

    return {
      payments: filteredPayments,
      issues: filteredIssues,
      products: filteredProducts,
      salesReps: filteredSalesReps,
      returns: filteredReturns,
      claims: filteredClaims,
      companies: companies.filter(
        (c) => !companyId || String(c._id) === companyId,
      ), // Filter companies if companyId is provided
      dueAmounts,
    };
  }

  async findOne(id: string): Promise<any> {
    // Check if id looks like a receipt number (starts with PAY-)
    let payment;
    if (id.startsWith("PAY-")) {
      payment = await this.srPaymentModel
        .findOne({ receiptNumber: id })
        .populate("srId")
        .populate("issueId", "issueNumber totalAmount")
        .populate("items.productId")
        .exec();
    } else {
      // Assume it's an ObjectId
      payment = await this.srPaymentModel
        .findById(id)
        .populate("srId")
        .populate("issueId", "issueNumber totalAmount")
        .populate("items.productId")
        .exec();
    }
    if (!payment) {
      throw new NotFoundException("SR Payment not found");
    }

    const paymentObj = payment.toObject() as any;
    if (payment.issueId) {
      const issueIdString =
        typeof payment.issueId === "string"
          ? payment.issueId
          : String((payment.issueId as any)?._id || payment.issueId);

      const issue = await this.srIssueModel.findById(issueIdString).exec();
      if (!issue) {
        // This should ideally not happen if data integrity is maintained
        // but as a fallback, we'll return payment with its own expected/received
        paymentObj.totalAmount = payment.totalExpected || 0;
        paymentObj.receivedAmount =
          payment.receivedAmount || payment.totalReceived || 0;
        paymentObj.due = Math.max(
          0,
          (payment.totalExpected || 0) - (payment.receivedAmount || 0),
        );
        return paymentObj;
      }

      // Fetch all payments for this issue to sum their received amounts
      const paymentsForIssue = await this.srPaymentModel
        .find({ issueId: issueIdString })
        .exec();
      const totalReceivedAmountForIssue = paymentsForIssue.reduce(
        (sum, p) => sum + (p.receivedAmount || 0),
        0,
      );

      // Fetch all returns for this issue to adjust the expected amount
      const returnsForIssue = await this.productReturnModel
        .find({ issueId: issueIdString })
        .populate("items.productId") // Populate product details to get tradePrice
        .exec();

      let adjustedTotalAmount = 0; // Initialize to 0

      // Iterate through issue items and sum their trade prices to get the initial adjusted total
      for (const issueItem of issue.items) {
        adjustedTotalAmount += issueItem.quantity * issueItem.tradePrice; // Use tradePrice from issue items
      }

      // Subtract return values from total amount based on product's tradePrice
      for (const returnDoc of returnsForIssue) {
        for (const returnItem of returnDoc.items) {
          const product = await this.productModel
            .findById(returnItem.productId)
            .exec();
          if (product) {
            const returnValue = returnItem.quantity * (product.tradePrice || 0);
            adjustedTotalAmount -= returnValue;
          }
        }
      }
      adjustedTotalAmount = Math.max(0, adjustedTotalAmount);

      const claimsForIssue = await this.companyClaimModel
        .find({ issueId: issueIdString })
        .exec();
      const totalCompanyClaimForIssue = claimsForIssue.reduce(
        (sum, claim) => sum + (claim.totalCompanyClaim || 0),
        0,
      );

      // Subtract company claims from adjusted total amount
      adjustedTotalAmount = Math.max(
        0,
        adjustedTotalAmount - totalCompanyClaimForIssue,
      );

      paymentObj.totalAmount = adjustedTotalAmount;
      paymentObj.totalReceivedAmount = totalReceivedAmountForIssue; // Total received across all payments for this issue
      paymentObj.receivedAmount =
        payment.receivedAmount || payment.totalReceived || 0; // This payment's received amount
      paymentObj.due = Math.max(
        0,
        adjustedTotalAmount - totalReceivedAmountForIssue,
      );
    } else {
      paymentObj.totalAmount = payment.totalExpected || 0;
      paymentObj.receivedAmount =
        payment.receivedAmount || payment.totalReceived || 0;
      paymentObj.due = Math.max(
        0,
        (payment.totalExpected || 0) - paymentObj.receivedAmount,
      );
    }
    return paymentObj;
  }

  async findBySR(
    srId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: any[]; pagination: any; totals: any }> {
    const { payments } = await this.getOptimized();
    const filteredPayments = payments.filter((p) => {
      const pSrId =
        typeof p.srId === "string"
          ? p.srId
          : String((p.srId as any)?._id || p.srId);
      return pSrId === srId;
    });

    // Calculate totals before pagination
    const totalReceived = filteredPayments.reduce(
      (sum, payment) => sum + (payment.totalReceived || 0),
      0,
    );

    const totalItems = filteredPayments.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      payments: filteredPayments.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      totals: {
        totalReceived,
      },
    };
  }

  async update(id: string, dto: UpdateSRPaymentDto): Promise<SRPayment> {
    // Explicitly set receiptNumber to undefined if it's an empty string or null
    if (
      dto.receiptNumber === null ||
      (dto.receiptNumber !== undefined && dto.receiptNumber.trim() === "")
    ) {
      dto.receiptNumber = undefined;
    }

    // Check if id looks like a receipt number (starts with PAY-)
    let payment;
    if (id.startsWith("PAY-")) {
      payment = await this.srPaymentModel.findOne({ receiptNumber: id }).exec();
    } else {
      payment = await this.srPaymentModel.findById(id).exec();
    }

    if (!payment) {
      throw new NotFoundException("SR Payment not found");
    }

    // If items are being updated, validate them
    if (dto.items && dto.items.length > 0) {
      // Recalculate totals for the current payment based on provided items
      let totalExpected = 0;
      let totalReceived = 0;
      let totalDiscount = 0;

      const items = dto.items.map((item) => {
        const expected = item.quantity * item.tradePrice;
        const received = item.quantity * item.tradePrice;
        const discount = expected - received;

        totalExpected += expected;
        totalReceived += received;
        totalDiscount += discount;

        return {
          productId:
            typeof item.productId === "string"
              ? item.productId
              : (item.productId as any)?._id,
          quantity: item.quantity,
          dealerPrice: item.dealerPrice,
          tradePrice: item.tradePrice,
          discount,
        };
      });

      const updateData: any = {
        ...dto,
        items,
        totalExpected,
        totalReceived: (payment.totalReceived || 0) + (dto.receivedAmount || 0), // Add current payment to cumulative
        totalDiscount,
        receivedAmount:
          (payment.receivedAmount || 0) + (dto.receivedAmount || 0), // Add current payment to cumulative
      };

      // Only update receiptNumber if a non-empty value is provided
      if (dto.receiptNumber && dto.receiptNumber.trim() !== "") {
        updateData.receiptNumber = dto.receiptNumber;
      } else if (
        !payment.receiptNumber &&
        (!dto.receiptNumber || dto.receiptNumber.trim() === "")
      ) {
        // If no receiptNumber exists on the payment and none is provided or it's empty, generate one
        updateData.receiptNumber = await this.generateReceiptNumber();
      } else if (dto.receiptNumber === undefined) {
        // If receiptNumber is explicitly undefined in DTO, remove it from updateData
        // so it doesn't overwrite the existing one with undefined (Mongoose default behavior for omitted fields)
        delete updateData.receiptNumber;
      } else if (dto.receiptNumber.trim() === "") {
        // If receiptNumber is an empty string, also remove it from updateData
        delete updateData.receiptNumber;
      }

      // Update customer due and company claim from frontend
      if (dto.companyClaim !== undefined) {
        updateData.companyClaim = dto.companyClaim;
      }
      if (dto.customerInfo !== undefined) {
        updateData.customerInfo = dto.customerInfo;
      }
      if (dto.customerDue !== undefined) {
        // Update customerDue for existing payment
        updateData.customerDue = dto.customerDue;
      }

      if (dto.notes) {
        updateData.notes = payment.notes
          ? `${payment.notes}\n${new Date().toLocaleString()}: ${dto.notes}`
          : dto.notes;
      }

      const updated = await this.srPaymentModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .populate("srId", "name phone")
        .populate("issueId", "issueNumber")
        .populate("items.productId", "name sku")
        .exec();

      // Automatically update claim when payment is updated
      if (updated.companyClaim && updated.companyClaim > 0) {
        try {
          await this.updateClaimFromPayment(updated);
        } catch (error) {
          // Log error but don't fail payment update
          console.error("Failed to auto-update claim for payment:", error);
        }
      }

      return updated;
    } else {
      // Update other fields without recalculating items
      const updated = await this.srPaymentModel
        .findByIdAndUpdate(id, { $set: dto }, { new: true })
        .populate("srId", "name phone")
        .populate("issueId", "issueNumber")
        .populate("items.productId", "name sku")
        .exec();

      // If payment method or notes changed, we don't need to update claim
      // Only update claim if items were actually modified (which is handled above)
      // So we skip claim update here

      return updated;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if id looks like a receipt number (starts with PAY-)
    let payment;
    if (id.startsWith("PAY-")) {
      payment = await this.srPaymentModel.findOne({ receiptNumber: id }).exec();
    } else {
      payment = await this.srPaymentModel.findById(id).exec();
    }

    if (!payment) {
      throw new NotFoundException("SR Payment not found");
    }

    // Find and delete associated claim first
    const claim = await this.companyClaimModel
      .findOne({ paymentId: payment._id })
      .exec();
    if (claim) {
      await this.companyClaimModel.findByIdAndDelete(claim._id).exec();
    }

    await this.srPaymentModel.findByIdAndDelete(payment._id).exec();
  }
}
