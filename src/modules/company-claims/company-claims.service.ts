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
  SRPayment,
  SRPaymentDocument,
} from "../../database/schemas/sr-payment.schema";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { CreateCompanyClaimDto } from "./dto/create-company-claim.dto";

@Injectable()
export class CompanyClaimsService {
  constructor(
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateCompanyClaimDto): Promise<CompanyClaim> {
    // Check if claim number exists
    const existing = await this.companyClaimModel
      .findOne({ claimNumber: dto.claimNumber })
      .exec();
    if (existing) {
      throw new ConflictException("Claim number already exists");
    }

    // Verify company exists
    const company = await this.companyModel.findById(dto.companyId).exec();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Calculate totals using the 100/95/6% logic
    let totalDealerPrice = 0;
    let totalCommission = 0;
    let totalSRPayment = 0;

    const items = dto.items.map((item) => {
      const dealerPriceTotal = item.quantity * item.dealerPrice;
      const commissionAmount = dealerPriceTotal * (item.commissionRate / 100);
      const netFromCompany =
        dealerPriceTotal + commissionAmount - item.srPayment;

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

    const savedClaim = await claim.save();

    // Emit WebSocket event for real-time updates
    try {
      await this.notificationsGateway.emitClaimsDataRefresh();
    } catch (error) {
      console.error("Failed to emit claims data refresh:", error);
    }

    return savedClaim;
  }

  async findAll(
    companyId?: string,
    page: number = 1,
    limit: number = 10,
    timePeriod: "all" | "week" | "month" | "year" = "all",
    searchQuery?: string,
  ): Promise<{ claims: CompanyClaim[]; pagination: any }> {
    const matchConditions: any = {};

    if (companyId) {
      // Use $eq to match the companyId field regardless of whether it's an ObjectId or string
      matchConditions.companyId = companyId;
    }

    const dateFilter: any = {};
    const now = new Date();
    switch (timePeriod) {
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);
        dateFilter.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
        break;
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        dateFilter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
        break;
      case "year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
        break;
      case "all":
      default:
        // No date filter for "all"
        break;
    }

    if (Object.keys(dateFilter).length > 0) {
      matchConditions.createdAt = dateFilter.createdAt;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      matchConditions.$or = [
        { claimNumber: searchRegex },
        { "companyInfo.name": searchRegex },
        { status: searchRegex },
      ];
    }

    // First, get the matching claim IDs with sorting (before lookups)
    const basePipeline = [
      { $match: matchConditions },
      { $sort: { createdAt: -1 as 1 } },
      { $project: { _id: 1 } }, // Only keep IDs for efficient pagination
    ];

    // Get total count
    const totalCountResult = await this.companyClaimModel.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);

    const totalItems =
      totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated claim IDs
    const paginatedIdsResult = await this.companyClaimModel.aggregate([
      ...basePipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]);

    const claimIds = paginatedIdsResult.map((item) => item._id);

    // Now do lookups on the paginated claims
    const pipeline: any[] = [
      { $match: { _id: { $in: claimIds } } },
      { $sort: { createdAt: -1 } }, // Maintain sort order
      {
        $lookup: {
          from: "companies",
          let: { companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$companyId"] },
                    { $eq: ["$_id", { $toObjectId: "$$companyId" }] },
                  ],
                },
              },
            },
          ],
          as: "companyInfo",
        },
      },
      {
        $unwind: {
          path: "$companyInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "srpayments",
          localField: "paymentId",
          foreignField: "_id",
          as: "paymentInfo",
        },
      },
      {
        $unwind: {
          path: "$paymentInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
    ];

    // Add final projection to include all necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        claimNumber: 1,
        companyId: 1,
        paymentId: 1,
        issueId: 1,
        items: 1,
        totalDealerPrice: 1,
        totalCompanyClaim: 1,
        totalSRPayment: 1,
        netFromCompany: 1,
        status: 1,
        notes: 1,
        createdAt: 1,
        updatedAt: 1,
        paidDate: 1,
        companyInfo: 1,
        paymentInfo: 1,
        productInfo: 1,
      },
    });

    const claims = await this.companyClaimModel.aggregate(pipeline);

    // Calculate totals for all claims (not just current page)
    const allClaimsStats = await this.companyClaimModel.aggregate([
      { $match: matchConditions }, // Same match conditions for consistency
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalClaimAmount: { $sum: "$totalCompanyClaim" },
          totalPaidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$totalCompanyClaim", 0],
            },
          },
          totalPendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$totalCompanyClaim", 0],
            },
          },
          paidClaimsCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
            },
          },
          pendingClaimsCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats =
      allClaimsStats.length > 0
        ? allClaimsStats[0]
        : {
            totalClaims: 0,
            totalClaimAmount: 0,
            totalPaidAmount: 0,
            totalPendingAmount: 0,
            paidClaimsCount: 0,
            pendingClaimsCount: 0,
          };

    const result = {
      claims,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      totals: {
        totalClaims: stats.totalClaims,
        totalClaimAmount: stats.totalClaimAmount,
        totalPaidAmount: stats.totalPaidAmount,
        totalPendingAmount: stats.totalPendingAmount,
        paidClaimsCount: stats.paidClaimsCount,
        pendingClaimsCount: stats.pendingClaimsCount,
      },
    };

    return result;
  }

  async findOne(id: string): Promise<CompanyClaim> {
    let claim;

    // Check if id is a valid ObjectId
    if (Types.ObjectId.isValid(id)) {
      claim = await this.companyClaimModel
        .findById(id)
        .populate("companyId", "name code") // Populate for frontend display
        .populate("paymentId", "receiptNumber") // Populate for frontend display
        .populate("items.productId", "name sku") // Populate for frontend display
        .exec();
    } else {
      // Assume it's a claim number
      claim = await this.companyClaimModel
        .findOne({ claimNumber: id })
        .populate("companyId", "name code") // Populate for frontend display
        .populate("paymentId", "receiptNumber") // Populate for frontend display
        .populate("items.productId", "name sku") // Populate for frontend display
        .exec();
    }

    if (!claim) {
      throw new NotFoundException("Company Claim not found");
    }
    return claim;
  }

  async update(id: string, updateData: any): Promise<CompanyClaim> {
    let updated;

    // Check if id is a valid ObjectId
    if (Types.ObjectId.isValid(id)) {
      updated = await this.companyClaimModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .exec();
    } else {
      // Assume it's a claim number
      updated = await this.companyClaimModel
        .findOneAndUpdate(
          { claimNumber: id },
          { $set: updateData },
          { new: true },
        )
        .exec();
    }

    if (!updated) {
      throw new NotFoundException("Company Claim not found");
    }

    // Emit WebSocket event for real-time updates
    try {
      await this.notificationsGateway.emitClaimsDataRefresh();
    } catch (error) {
      console.error("Failed to emit claims data refresh:", error);
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: ClaimStatus,
    paidDate?: Date,
  ): Promise<CompanyClaim> {
    let updated: any;

    try {
      const updateData: any = { status };
      if (status === ClaimStatus.PAID && paidDate) {
        updateData.paidDate = paidDate;
      }

      // Check if id is a valid ObjectId
      if (Types.ObjectId.isValid(id)) {
        updated = await this.companyClaimModel
          .findByIdAndUpdate(id, { $set: updateData }, { new: true })
          .exec();
      } else {
        // Assume it's a claim number
        updated = await this.companyClaimModel
          .findOneAndUpdate(
            { claimNumber: id },
            { $set: updateData },
            { new: true },
          )
          .exec();
      }
      if (!updated) {
        throw new NotFoundException("Company Claim not found");
      }
    } catch (error) {
      console.error("❌ SERVICE: Error updating claim:", error);
      throw error;
    }

    // If claim is marked as paid, update the payment's receivedAmount
    if (status === ClaimStatus.PAID) {
      // Handle paymentId - it might be a string or an object
      let paymentIdToUse: string | null = null;
      if (updated.paymentId) {
        if (typeof updated.paymentId === "string") {
          paymentIdToUse = updated.paymentId;
        } else if (
          typeof updated.paymentId === "object" &&
          (updated.paymentId as any)._id
        ) {
          paymentIdToUse = (updated.paymentId as any)._id;
        }
      }

      // If paymentId is missing or wrong, try to find the correct payment
      if (
        !paymentIdToUse ||
        (typeof paymentIdToUse === "string" && paymentIdToUse.trim() === "")
      ) {
        if (updated.issueId) {
          try {
            // Find all payments for this issue
            const payments = await this.srPaymentModel
              .find({
                $or: [
                  { issueId: updated.issueId },
                  { issueId: new Types.ObjectId(updated.issueId) },
                ],
              })
              .exec();

            if (payments.length > 0) {
              // Sort by creation date (newest first) and pick the most recent payment
              const sortedPayments = payments.sort((a, b) => {
                const aTime = (a as any).createdAt
                  ? new Date((a as any).createdAt).getTime()
                  : 0;
                const bTime = (b as any).createdAt
                  ? new Date((b as any).createdAt).getTime()
                  : 0;
                return bTime - aTime;
              });

              const latestPayment = sortedPayments[0];
              paymentIdToUse = latestPayment._id.toString();

              // Update the claim's paymentId to the correct one
              updated.paymentId = paymentIdToUse;
              await updated.save();
            }
          } catch (error) {
            console.error("Failed to find payment by issueId:", error);
          }
        }
      }

      // Now update the payment's receivedAmount
      if (paymentIdToUse) {
        try {
          const payment = await this.srPaymentModel
            .findById(paymentIdToUse)
            .exec();
          if (payment) {
            const oldReceived = payment.receivedAmount || 0;
            const newReceived = oldReceived + updated.totalCompanyClaim;
            payment.receivedAmount = newReceived;
            const savedPayment = await payment.save();

            // Verify the save worked by fetching again
            const verifyPayment = await this.srPaymentModel
              .findById(paymentIdToUse)
              .exec();
          } else {
            console.error("❌ Payment not found for update:", paymentIdToUse);
          }
        } catch (error) {
          console.error("Failed to update payment receivedAmount:", error);
        }
      }
    }

    // Emit WebSocket event for cross-page updates (payment receivedAmount changed)
    setTimeout(async () => {
      try {
        await this.notificationsGateway.emitClaimsDataRefresh();
      } catch (error) {
        console.error("❌ Failed to emit claims data refresh:", error);
      }
    }, 100); // 100ms delay

    return updated;
  }
}
