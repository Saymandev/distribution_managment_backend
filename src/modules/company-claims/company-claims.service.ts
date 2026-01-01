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

  async findAll(): Promise<CompanyClaim[]> {
    return this.companyClaimModel
      .find()
      .populate("companyId", "name code")
      .populate("paymentId", "receiptNumber")
      .populate("items.productId", "name sku")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCompany(companyId: string): Promise<CompanyClaim[]> {
    return this.companyClaimModel
      .find({ companyId: companyId })
      .populate("companyId", "name code")
      .populate("paymentId", "receiptNumber")
      .populate("items.productId", "name sku")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CompanyClaim> {
    const claim = await this.companyClaimModel
      .findById(id)
      .populate("companyId")
      .populate("paymentId")
      .populate("items.productId")
      .exec();
    if (!claim) {
      throw new NotFoundException("Company Claim not found");
    }
    return claim;
  }

  async update(id: string, updateData: any): Promise<CompanyClaim> {
    const updated = await this.companyClaimModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
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

      updated = await this.companyClaimModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .exec();
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
            console.log(
              "💰 Saved payment receivedAmount:",
              savedPayment.receivedAmount,
            );

            // Verify the save worked by fetching again
            const verifyPayment = await this.srPaymentModel
              .findById(paymentIdToUse)
              .exec();
            console.log(
              "🔍 Verification - payment receivedAmount after save:",
              verifyPayment?.receivedAmount,
            );
            console.log("💰 Claim amount added:", updated.totalCompanyClaim);
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
        console.log("📡 Emitting claims-data-refresh WebSocket event");
        await this.notificationsGateway.emitClaimsDataRefresh();
        console.log("✅ Claims data refresh event emitted successfully");
      } catch (error) {
        console.error("❌ Failed to emit claims data refresh:", error);
      }
    }, 100); // 100ms delay

    return updated;
  }
  catch(error) {
    console.error("❌ SERVICE: updateStatus outer catch:", error);
    throw error;
  }
}
