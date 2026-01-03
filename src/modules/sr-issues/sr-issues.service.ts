import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CompanyClaim,
  CompanyClaimDocument,
} from "../../database/schemas/company-claim.schema";
import {
  ProductReturn,
  ProductReturnDocument,
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
import { CreateSRIssueDto } from "./dto/create-sr-issue.dto";

@Injectable()
export class SRIssuesService {
  constructor(
    @InjectModel(SRIssue.name)
    private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(SalesRep.name)
    private readonly salesRepModel: Model<SalesRepDocument>,
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(ProductReturn.name)
    private readonly productReturnModel: Model<ProductReturnDocument>,
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
  ) {}

  async generateIssueNumber(): Promise<string> {
    const lastIssue = await this.srIssueModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastIssue || !lastIssue.issueNumber) {
      return "ISSUE-001";
    }

    const match = lastIssue.issueNumber.match(/ISSUE-(\d+)/);
    if (!match) {
      return "ISSUE-001";
    }

    const lastNumber = parseInt(match[1] || "0");
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `ISSUE-${nextNumber}`;
  }

  async create(dto: CreateSRIssueDto): Promise<SRIssue> {
    // Auto-generate issue number if not provided
    let issueNumber = dto.issueNumber;
    if (!issueNumber) {
      issueNumber = await this.generateIssueNumber();
    }

    // Check if issue number exists
    const existing = await this.srIssueModel.findOne({ issueNumber }).exec();
    if (existing) {
      throw new ConflictException("Issue number already exists");
    }

    // Verify SR exists
    const sr = await this.salesRepModel.findById(dto.srId).exec();
    if (!sr) {
      throw new NotFoundException("Sales Rep not found");
    }

    // Calculate total amount and verify stock
    // First, check all products exist and calculate total quantities per product
    // (in case same product is added multiple times)
    const productQuantities = new Map<string, number>();
    const productMap = new Map<string, ProductDocument>();

    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      // Sum quantities if same product appears multiple times
      const currentQty = productQuantities.get(item.productId) || 0;
      productQuantities.set(item.productId, currentQty + item.quantity);
      productMap.set(item.productId, product);
    }

    // Now validate stock for each product (checking total quantity)
    for (const [productId, totalQuantity] of productQuantities.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      if (product.stock < totalQuantity) {
        throw new ConflictException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${totalQuantity}`,
        );
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of dto.items) {
      totalAmount += item.quantity * item.tradePrice;
    }

    // Create issue
    const issue = new this.srIssueModel({
      ...dto,
      issueNumber,
      totalAmount,
      issueDate: new Date(),
    });

    // Reduce stock for each product
    for (const item of dto.items) {
      await this.productModel
        .findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        })
        .exec();
    }

    return issue.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ issues: SRIssue[]; pagination: any }> {
    const { issues } = await this.getOptimized();
    const totalItems = issues.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      issues: issues.slice(startIndex, endIndex),
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

  async findOne(id: string): Promise<SRIssue> {
    const issue = await this.srIssueModel
      .findById(id)
      .populate("srId")
      .populate("items.productId")
      .lean() // Use lean for better performance
      .exec();
    if (!issue) {
      throw new NotFoundException("SR Issue not found");
    }

    // Calculate total received for this single issue
    const paymentsForIssue = await this.srPaymentModel
      .find({
        $or: [
          { issueId: issue._id },
          { issueId: String(issue._id) },
          { issueId: new Types.ObjectId(String(issue._id)) },
        ],
      })
      .lean()
      .exec();
    const totalReceivedAmount = paymentsForIssue.reduce(
      (sum, payment) => sum + (payment.receivedAmount || 0),
      0,
    );

    // Adjust total amount for returns for this single issue
    const returnsForIssue = await this.productReturnModel
      .find({ issueId: issue._id })
      .populate("items.productId")
      .lean()
      .exec();
    let adjustedTotalAmount = issue.totalAmount || 0;
    for (const returnDoc of returnsForIssue) {
      for (const returnItem of returnDoc.items) {
        // Assuming returnItem.productId is populated or a string
        const product = await this.productModel
          .findById(returnItem.productId)
          .exec(); // Fetch product for calculations
        if (product) {
          const returnValue = returnItem.quantity * (product.tradePrice || 0);
          adjustedTotalAmount -= returnValue;
        }
      }
    }

    adjustedTotalAmount = Math.max(0, adjustedTotalAmount);

    // Calculate company claims and customer dues for this issue
    const companyClaimsForIssue = paymentsForIssue.reduce(
      (sum, payment) => sum + (payment.companyClaim || 0),
      0,
    );
    const customerDuesForIssue = paymentsForIssue.reduce(
      (sum, payment) => sum + (payment.customerDue || 0),
      0,
    );

    // Due calculation: if there are outstanding customer dues, the issue is not fully paid
    const due =
      customerDuesForIssue > 0
        ? customerDuesForIssue
        : Math.max(
            0,
            adjustedTotalAmount - totalReceivedAmount - companyClaimsForIssue,
          );

    // Enrich the single issue object
    const enrichedIssue = {
      ...issue,
      calculatedTotalAmount: adjustedTotalAmount,
      calculatedReceivedAmount: totalReceivedAmount,
      calculatedDue: due,
    } as SRIssue;

    return enrichedIssue;
  }

  async findBySR(
    srId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ issues: SRIssue[]; pagination: any; totals: any }> {
    const { issues } = await this.getOptimized();
    const filteredIssues = issues.filter((issue) => {
      const issueSrId =
        typeof issue.srId === "string"
          ? issue.srId
          : (issue.srId as any)?._id?.toString();
      return issueSrId === srId;
    });

    // Calculate totals before pagination
    const totalAmount = filteredIssues.reduce(
      (sum, issue) => sum + (issue.totalAmount || 0),
      0,
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

    const totalItems = filteredIssues.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      issues: paginatedIssues,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      totals: {
        totalAmount,
      },
    };
  }

  // Optimized method to get all issues with calculated due amounts (no N+1 queries)
  async getOptimized(companyId?: string): Promise<{
    issues: SRIssue[];
    salesReps: SalesRep[];
    products: Product[];
    payments: SRPayment[];
    returns: ProductReturn[];
    claims: CompanyClaim[];
    dueAmounts: Record<
      string,
      { totalAmount: number; receivedAmount: number; due: number }
    >;
  }> {
    // Fetch all necessary data in bulk
    const [issues, salesReps, products, payments, returns, claims] =
      await Promise.all([
        this.srIssueModel
          .find()
          .populate("items.productId")
          .populate("srId")
          .lean()
          .sort({ issueDate: -1, createdAt: -1 })
          .exec(),
        this.salesRepModel
          .find(companyId ? { companyId } : {})
          .lean()
          .exec(),
        this.productModel
          .find(companyId ? { companyId } : {})
          .lean()
          .exec(),
        this.srPaymentModel.find().lean().exec(),
        this.productReturnModel
          .find()
          .populate("items.productId")
          .lean()
          .exec(),
        this.companyClaimModel.find().lean().exec(),
      ]);

    // Create maps for efficient lookups
    const productMap = new Map<string, Product>(
      products.map((p) => [String(p._id), p]),
    );
    const issuePaymentMap = new Map<string, SRPayment[]>(); // issueId -> payments for that issue
    payments.forEach((p) => {
      const issueId = String(p.issueId);
      if (!issuePaymentMap.has(issueId)) {
        issuePaymentMap.set(issueId, []);
      }
      issuePaymentMap.get(issueId)?.push(p);
    });

    const issueReturnMap = new Map<string, ProductReturn[]>(); // issueId -> returns for that issue
    returns.forEach((r) => {
      const issueId = String(r.issueId);
      if (!issueReturnMap.has(issueId)) {
        issueReturnMap.set(issueId, []);
      }
      issueReturnMap.get(issueId)?.push(r);
    });

    const dueAmounts: Record<
      string,
      { totalAmount: number; receivedAmount: number; due: number }
    > = {};
    const enrichedIssues: SRIssue[] = [];

    for (const issue of issues) {
      const issueId = String(issue._id);
      let adjustedTotalAmount = issue.totalAmount || 0;
      let totalReceivedAmount = 0;

      // Calculate total received for this issue
      const paymentsForIssue = issuePaymentMap.get(issueId) || [];
      totalReceivedAmount = paymentsForIssue.reduce(
        (sum, payment) => sum + (payment.receivedAmount || 0),
        0,
      );

      // Adjust total amount for returns
      const returnsForIssue = issueReturnMap.get(issueId) || [];
      for (const returnDoc of returnsForIssue) {
        for (const returnItem of returnDoc.items) {
          const product = productMap.get(String(returnItem.productId));
          if (product) {
            const returnValue = returnItem.quantity * (product.tradePrice || 0);
            adjustedTotalAmount -= returnValue;
          }
        }
      }

      adjustedTotalAmount = Math.max(0, adjustedTotalAmount);

      // Calculate outstanding company claims and customer dues for this issue
      // Only include unpaid claims and unsettled customer dues
      let companyClaimsForIssue = 0;
      let customerDuesForIssue = 0;

      paymentsForIssue.forEach((payment) => {
        // Only include customer dues that haven't been settled (customerDue > 0 means outstanding)
        if (payment.customerDue && payment.customerDue > 0) {
          customerDuesForIssue += payment.customerDue;
        }

        // For company claims, check if the corresponding claim is still unpaid
        if (payment.companyClaim && payment.companyClaim > 0) {
          // Find if there's a corresponding claim for this payment that's still pending
          const relatedClaim = claims.find((claim) => {
            const claimPaymentId =
              typeof claim.paymentId === "string"
                ? claim.paymentId
                : String((claim.paymentId as any)?._id || claim.paymentId);
            const paymentId = String((payment as any)._id);
            return claimPaymentId === paymentId && claim.status !== "paid";
          });

          // Only include company claims that haven't been paid yet
          if (relatedClaim) {
            companyClaimsForIssue += payment.companyClaim;
          }
        }
      });

      // Due calculation: If there are outstanding customer dues or unpaid company claims,
      // include both as due amounts. Otherwise use traditional calculation.
      const hasOutstandingDues =
        customerDuesForIssue > 0 || companyClaimsForIssue > 0;
      const due = hasOutstandingDues
        ? customerDuesForIssue + companyClaimsForIssue
        : Math.max(0, adjustedTotalAmount - totalReceivedAmount);

      dueAmounts[issueId] = {
        totalAmount: adjustedTotalAmount,
        receivedAmount: totalReceivedAmount,
        due,
      };

      // Enrich the issue object with calculated values
      const enrichedIssue = {
        ...issue,
        calculatedTotalAmount: adjustedTotalAmount,
        calculatedReceivedAmount: totalReceivedAmount,
        calculatedDue: due,
      } as SRIssue;

      enrichedIssues.push(enrichedIssue);
    }

    // Ensure the final enrichedIssues array is sorted from new to old
    enrichedIssues.sort((a, b) => {
      const dateA = new Date(a.issueDate || (a as any).createdAt).getTime();
      const dateB = new Date(b.issueDate || (b as any).createdAt).getTime();
      return dateB - dateA; // Sort descending (newest first)
    });

    return {
      issues: enrichedIssues,
      salesReps,
      products,
      payments,
      returns,
      claims,
      dueAmounts,
    };
  }
}
