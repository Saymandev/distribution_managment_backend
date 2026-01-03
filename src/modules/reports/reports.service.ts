import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CompanyClaim,
  CompanyClaimDocument,
} from "../../database/schemas/company-claim.schema";
import {
  Company,
  CompanyDocument,
} from "../../database/schemas/company.schema";
import {
  Expense,
  ExpenseDocument,
} from "../../database/schemas/expense.schema";
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
  SupplierPayment,
  SupplierPaymentDocument,
  SupplierReceipt,
  SupplierReceiptDocument,
} from "../../database/schemas/sr-payment.schema";

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(SRIssue.name)
    private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(SalesRep.name)
    private readonly salesRepModel: Model<SalesRepDocument>,
    @InjectModel(ProductReturn.name)
    private readonly productReturnModel: Model<ProductReturnDocument>,
    @InjectModel(SupplierPayment.name)
    private readonly supplierPaymentModel: Model<SupplierPaymentDocument>,
    @InjectModel(SupplierReceipt.name)
    private readonly supplierReceiptModel: Model<SupplierReceiptDocument>,
  ) {}

  async getDashboard(companyId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Debug: Check if there's any data at all
    const allPayments = await this.srPaymentModel
      .find()
      .limit(5)
      .select("paymentDate totalReceived")
      .exec();
    const allClaims = await this.companyClaimModel
      .find()
      .limit(5)
      .select("createdAt paidDate status totalClaim netFromCompany companyId")
      .exec();
    const allExpenses = await this.expenseModel
      .find()
      .limit(5)
      .select("date amount")
      .exec();

    // Build match conditions for claims - show ALL claims, not just today's
    // Try using string first - Mongoose/MongoDB should handle the conversion
    const claimMatch: any = {};

    if (companyId) {
      // Use string - MongoDB/Mongoose will convert it to ObjectId automatically
      claimMatch.companyId = companyId;
    }

    // Match for paid claims - filter by paidDate if it exists (today's paid claims)
    // Also include claims with status 'paid' even if paidDate is not set (for backward compatibility)
    // Handle both lowercase 'paid' and any case variations
    const paidClaimMatch: any = {
      $and: [
        {
          $or: [{ status: "paid" }, { status: "Paid" }, { status: "PAID" }],
        },
        {
          $or: [
            // Match if paidDate is within today's range
            {
              paidDate: {
                $gte: today,
                $lte: endOfToday,
              },
            },
            // Or if paidDate doesn't exist but createdAt is today
            {
              $and: [
                { paidDate: { $exists: false } },
                { createdAt: { $gte: today, $lte: endOfToday } },
              ],
            },
            // Or if paidDate exists but is null/undefined (handle edge cases)
            {
              $and: [
                { paidDate: null },
                { createdAt: { $gte: today, $lte: endOfToday } },
              ],
            },
          ],
        },
      ],
    };

    if (companyId) {
      // Use string - MongoDB will handle the conversion
      paidClaimMatch.$and.push({ companyId: companyId });
    }

    // Get ALL Company Claims statistics (not filtered by date)
    // Use the same claimMatch for aggregation - MongoDB will handle string to ObjectId conversion
    const allClaimsStats = await this.companyClaimModel.aggregate([
      { $match: claimMatch },
      {
        $group: {
          _id: null,
          totalClaimAmount: { $sum: "$totalClaim" },
          pendingClaimAmount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "pending"] },
                    { $eq: ["$status", "Pending"] },
                    { $eq: ["$status", "PENDING"] },
                  ],
                },
                "$totalClaim",
                0,
              ],
            },
          },
          netClaimAmount: { $sum: "$netFromCompany" },
        },
      },
    ]);

    // Get TODAY's Paid Claims (filtered by paidDate)
    // Paid Claim should show the net amount received from company, not total claim
    // Use paidClaimMatch directly - MongoDB will handle string to ObjectId conversion
    const todayPaidClaims = await this.companyClaimModel.aggregate([
      { $match: paidClaimMatch },
      {
        $group: {
          _id: null,
          paidClaimAmount: { $sum: "$netFromCompany" }, // Net amount received, not total claim
        },
      },
    ]);

    // Today's Expenses
    const todayExpenses = await this.expenseModel.aggregate([
      {
        $match: {
          date: { $gte: today, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const claimsStats =
      allClaimsStats.length > 0
        ? allClaimsStats[0]
        : {
            totalClaimAmount: 0,
            pendingClaimAmount: 0,
            netClaimAmount: 0,
          };

    const paidClaimAmount =
      todayPaidClaims.length > 0 ? todayPaidClaims[0].paidClaimAmount || 0 : 0;
    const expensesTotal =
      todayExpenses.length > 0 ? todayExpenses[0].total || 0 : 0;

    // Net Profit = Paid Claim - Expense
    const netProfit = paidClaimAmount - expensesTotal;

    return {
      today: {
        totalClaimAmount: claimsStats.totalClaimAmount || 0,
        pendingClaimAmount: claimsStats.pendingClaimAmount || 0,
        paidClaimAmount: paidClaimAmount || 0,
        netClaimAmount: claimsStats.netClaimAmount || 0,
        expenses: expensesTotal || 0,
        netProfit: netProfit || 0,
      },
    };
  }

  async getWeeklyData(companyId?: string) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Build match conditions for this day
      const paymentMatch: any = {
        paymentDate: { $gte: dayStart, $lte: dayEnd },
      };

      const claimMatch: any = {
        createdAt: { $gte: dayStart, $lte: dayEnd },
      };

      const expenseMatch: any = {
        date: { $gte: dayStart, $lte: dayEnd },
      };

      if (companyId) {
        // Try both ObjectId and string formats for companyId
        // Note: We need to include createdAt in each $or condition
        const baseMatch = { createdAt: { $gte: dayStart, $lte: dayEnd } };
        claimMatch.$or = [
          { ...baseMatch, companyId: new Types.ObjectId(companyId) },
          { ...baseMatch, companyId: companyId },
        ];
      }

      // Get SR Payments for this day
      // For company filtering, we need to check if the payment's issue has products from that company
      let daySRPayments;
      if (companyId) {
        // Try both ObjectId and string formats for companyId
        const companyIdObj = new Types.ObjectId(companyId);
        const companyProducts = await this.productModel
          .find({
            $or: [{ companyId: companyIdObj }, { companyId: companyId }],
          })
          .select("_id")
          .exec();

        const productIds = companyProducts.map((p) => p._id.toString());

        // Get issues that have these products
        const companyIssues = await this.srIssueModel
          .find({
            "items.productId": { $in: productIds },
          })
          .select("_id")
          .exec();

        const issueIds = companyIssues.map((issue) => issue._id);

        if (issueIds.length === 0) {
          daySRPayments = [];
        } else {
          // Convert issueIds to strings for matching (MongoDB handles both)
          const issueIdStrings = issueIds.map((id) => id.toString());
          const issueIdObjectIds = issueIds.map((id) => new Types.ObjectId(id));

          // Get payments for these issues - try both string and ObjectId formats
          const paymentMatchWithIssue = {
            ...paymentMatch,
            $or: [
              { issueId: { $in: issueIdStrings } },
              { issueId: { $in: issueIdObjectIds } },
            ],
          };

          daySRPayments = await this.srPaymentModel.aggregate([
            { $match: paymentMatchWithIssue },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalReceived" },
              },
            },
          ]);
        }
      } else {
        daySRPayments = await this.srPaymentModel.aggregate([
          { $match: paymentMatch },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalReceived" },
            },
          },
        ]);
      }

      // Get Company Claims for this day
      const dayClaims = await this.companyClaimModel.aggregate([
        { $match: claimMatch },
        {
          $group: {
            _id: null,
            total: { $sum: "$netFromCompany" },
          },
        },
      ]);

      // Get Expenses for this day
      const dayExpenses = await this.expenseModel.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const payments = daySRPayments.length > 0 ? daySRPayments[0].total : 0;
      const claims = dayClaims.length > 0 ? dayClaims[0].total : 0;
      const expenses = dayExpenses.length > 0 ? dayExpenses[0].total : 0;

      weeklyData.push({
        name: days[i],
        payments: Math.round(payments),
        claims: Math.round(claims),
        expenses: Math.round(expenses),
        profit: Math.round(payments + claims - expenses),
      });
    }

    return weeklyData;
  }

  async getMonthlyData(companyId?: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const weeks = [];
    const currentWeekStart = new Date(startOfMonth);

    // Get first Monday of the month or use the 1st
    const firstDay = startOfMonth.getDay();
    if (firstDay !== 1) {
      const daysToAdd = firstDay === 0 ? 1 : 8 - firstDay;
      currentWeekStart.setDate(startOfMonth.getDate() + daysToAdd);
    }

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Build match conditions for this week
      const paymentMatch: any = {
        paymentDate: { $gte: weekStart, $lte: weekEnd },
      };

      const claimMatch: any = {
        createdAt: { $gte: weekStart, $lte: weekEnd },
      };

      const expenseMatch: any = {
        date: { $gte: weekStart, $lte: weekEnd },
      };

      if (companyId) {
        // Try both ObjectId and string formats for companyId
        // Note: We need to include createdAt in each $or condition
        const baseMatch = { createdAt: { $gte: weekStart, $lte: weekEnd } };
        claimMatch.$or = [
          { ...baseMatch, companyId: new Types.ObjectId(companyId) },
          { ...baseMatch, companyId: companyId },
        ];
      }

      // Get SR Payments for this week
      // For company filtering, we need to check if the payment's issue has products from that company
      let weekSRPayments;
      if (companyId) {
        // Try both ObjectId and string formats for companyId
        const companyIdObj = new Types.ObjectId(companyId);
        const companyProducts = await this.productModel
          .find({
            $or: [{ companyId: companyIdObj }, { companyId: companyId }],
          })
          .select("_id")
          .exec();

        const productIds = companyProducts.map((p) => p._id.toString());

        // Get issues that have these products
        const companyIssues = await this.srIssueModel
          .find({
            "items.productId": { $in: productIds },
          })
          .select("_id")
          .exec();

        const issueIds = companyIssues.map((issue) => issue._id);

        if (issueIds.length === 0) {
          weekSRPayments = [];
        } else {
          // Convert issueIds to strings for matching (MongoDB handles both)
          const issueIdStrings = issueIds.map((id) => id.toString());
          const issueIdObjectIds = issueIds.map((id) => new Types.ObjectId(id));

          // Get payments for these issues - try both string and ObjectId formats
          const paymentMatchWithIssue = {
            ...paymentMatch,
            $or: [
              { issueId: { $in: issueIdStrings } },
              { issueId: { $in: issueIdObjectIds } },
            ],
          };

          weekSRPayments = await this.srPaymentModel.aggregate([
            { $match: paymentMatchWithIssue },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalReceived" },
              },
            },
          ]);
        }
      } else {
        weekSRPayments = await this.srPaymentModel.aggregate([
          { $match: paymentMatch },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalReceived" },
            },
          },
        ]);
      }

      // Get Company Claims for this week
      const weekClaims = await this.companyClaimModel.aggregate([
        { $match: claimMatch },
        {
          $group: {
            _id: null,
            total: { $sum: "$netFromCompany" },
          },
        },
      ]);

      // Get Expenses for this week
      const weekExpenses = await this.expenseModel.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const revenue =
        (weekSRPayments.length > 0 ? weekSRPayments[0].total : 0) +
        (weekClaims.length > 0 ? weekClaims[0].total : 0);
      const expenses = weekExpenses.length > 0 ? weekExpenses[0].total : 0;
      const profit = revenue - expenses;

      weeks.push({
        name: `Week ${week + 1}`,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        profit: Math.round(profit),
      });
    }

    return weeks;
  }

  async getProfitLoss(companyId?: string, startDate?: Date, endDate?: Date) {
    // If no dates provided, default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Ensure dates cover full day range
    let finalStartDate = startDate || startOfMonth;
    let finalEndDate = endDate || endOfMonth;

    // Normalize dates to ensure full day coverage
    if (startDate) {
      finalStartDate = new Date(startDate);
      finalStartDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      finalEndDate = new Date(endDate);
      finalEndDate.setHours(23, 59, 59, 999);
    }

    const matchConditions: any = {};

    if (companyId) {
      matchConditions.companyId = companyId;
    }

    // Always apply date filter
    matchConditions.createdAt = {
      $gte: finalStartDate,
      $lte: finalEndDate,
    };

    // Get SR Payments and Sales Data
    const srPaymentsMatch: any = {
      paymentDate: {
        $gte: finalStartDate,
        $lte: finalEndDate,
      },
    };

    const srPayments = await this.srPaymentModel.aggregate([
      { $match: srPaymentsMatch },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$totalReceived" },
          totalExpected: { $sum: "$totalExpected" }, // Total sales value
        },
      },
    ]);

    // Get outstanding customer dues - more comprehensive calculation
    const outstandingReceivables = await this.srPaymentModel.aggregate([
      {
        $match: srPaymentsMatch, // Include all payments in date range
      },
      {
        $group: {
          _id: null,
          totalCustomerDue: { $sum: { $max: ["$customerDue", 0] } }, // Sum all positive customer dues
          totalUnpaid: {
            $sum: {
              $max: [{ $subtract: ["$totalExpected", "$totalReceived"] }, 0],
            },
          }, // Sum unpaid portions
        },
      },
    ]);

    // Calculate total outstanding as the maximum of explicit customer dues and unpaid amounts
    const customerDueAmount =
      outstandingReceivables.length > 0
        ? outstandingReceivables[0].totalCustomerDue || 0
        : 0;
    const unpaidAmount =
      outstandingReceivables.length > 0
        ? outstandingReceivables[0].totalUnpaid || 0
        : 0;
    const totalOutstandingReceivables = Math.max(
      customerDueAmount,
      unpaidAmount,
    );

    // Get Company Claims and Supplier Costs
    // Get pending claims suppliers still owe compensation
    // Note: We don't filter claims by date since supplier compensation is cumulative
    const dateFilteredMatch = { ...matchConditions };
    delete dateFilteredMatch.createdAt; // Remove date filtering for claims

    console.log("DEBUG - Claims query match:", {
      ...dateFilteredMatch,
      status: "pending",
    });

    const pendingClaims = await this.companyClaimModel
      .find({
        ...dateFilteredMatch,
        status: "pending",
      })
      .exec();

    console.log("DEBUG - Found pending claims:", pendingClaims.length);
    pendingClaims.forEach((c) =>
      console.log(
        "  ",
        c.claimNumber,
        ":",
        c.netFromCompany,
        "company:",
        c.companyId,
      ),
    );

    // Calculate total compensation owed by suppliers
    // Only include positive claims (negative claims are likely data errors)
    const totalNetFromCompany = pendingClaims
      .filter((claim) => (claim.netFromCompany || 0) > 0)
      .reduce((sum, claim) => sum + (claim.netFromCompany || 0), 0);

    // Group claims by company for proper byCompany breakdown
    const companyGroups = pendingClaims.reduce(
      (groups, claim) => {
        const companyId = claim.companyId;
        const companyKey =
          typeof companyId === "string"
            ? companyId
            : (companyId as any)?._id?.toString() || "unknown";

        if (!groups[companyKey]) {
          groups[companyKey] = {
            _id: companyKey,
            totalNetFromCompany: 0,
            totalDealerPrice: 0,
            totalCommission: 0,
            totalSRPayment: 0,
          };
        }

        groups[companyKey].totalNetFromCompany += claim.netFromCompany || 0;
        groups[companyKey].totalDealerPrice += claim.totalDealerPrice || 0;
        groups[companyKey].totalCommission += 0; // Not available in claim data
        groups[companyKey].totalSRPayment += claim.totalSRPayment || 0;

        return groups;
      },
      {} as Record<string, any>,
    );

    const companyClaims = Object.values(companyGroups);

    // Get Expenses - use same date range
    const expensesMatch: any = {
      date: {
        $gte: finalStartDate,
        $lte: finalEndDate,
      },
    };

    const expenses = await this.expenseModel.aggregate([
      { $match: expensesMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate Inventory Values (simplified - assuming average cost method)
    // In a real system, you'd track actual inventory movements
    const inventoryValue = await this.productModel.aggregate([
      {
        $group: {
          _id: null,
          totalStockValue: {
            $sum: { $multiply: ["$stock", "$dealerPrice"] }, // Using dealer price as cost
          },
        },
      },
    ]);

    // Calculate supplier purchases (cost of goods acquired)
    const supplierPurchases = companyClaims.reduce(
      (sum, claim) => sum + (claim.totalDealerPrice || 0),
      0,
    );

    const totalSRPayments =
      srPayments.length > 0 ? srPayments[0].totalReceived : 0;
    const totalSalesValue =
      srPayments.length > 0 ? srPayments[0].totalExpected : 0;
    // totalOutstandingReceivables is already calculated above
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    const currentInventoryValue =
      inventoryValue.length > 0 ? inventoryValue[0].totalStockValue : 0;

    if (companyId) {
      // Single company profit/loss with inventory accounting
      const claim = companyClaims.length > 0 ? companyClaims[0] : null;
      const totalNetFromCompany = claim ? claim.totalNetFromCompany : 0;
      const companyPurchases = claim ? claim.totalDealerPrice : 0;

      // Revenue = SR payments (includes compensation for discounts)
      const totalRevenue = totalSalesValue;

      // COGS = Purchases
      const cogs = companyPurchases;

      // Gross Profit
      const grossProfit = totalRevenue - cogs;

      // Net Profit
      const netProfit = grossProfit - totalExpenses;

      // Get company name for the byCompany array
      const companies = await this.companyModel
        .find({ _id: companyId })
        .select("_id name")
        .exec();

      const companyMap = new Map(
        companies.map((c) => [c._id.toString(), c.name]),
      );

      return {
        companyId,
        period: {
          startDate: finalStartDate,
          endDate: finalEndDate,
        },
        revenue: {
          salesRevenue: totalSalesValue,
          cashReceived: totalSRPayments,
          outstandingReceivables: totalOutstandingReceivables,
          total: totalRevenue,
        },
        cogs: {
          purchases: companyPurchases,
          netCOGS: cogs,
        },
        profitability: {
          grossProfit,
          operatingExpenses: totalExpenses,
          netProfit,
        },
        inventory: {
          currentValue: currentInventoryValue,
        },
        outstanding: {
          customerDues: totalOutstandingReceivables,
          supplierClaims: totalNetFromCompany,
        },
        byCompany: claim
          ? [
              {
                companyId: claim._id,
                companyName:
                  companyMap.get(claim._id?.toString() || "") ||
                  "Unknown Company",
                netFromCompany: claim.totalNetFromCompany,
                totalDealerPrice: claim.totalDealerPrice,
                totalCommission: claim.totalCommission,
                totalSRPayment: claim.totalSRPayment,
              },
            ]
          : [],
        details: claim || {},
      };
    } else {
      // All companies profit/loss with inventory accounting
      const totalNetFromCompany = companyClaims.reduce(
        (sum, c) => sum + c.totalNetFromCompany,
        0,
      );
      const totalPurchases = companyClaims.reduce(
        (sum, c) => sum + (c.totalDealerPrice || 0),
        0,
      );

      // Revenue = SR payments + Company claims (both are income)
      const totalRevenue = totalSalesValue + totalNetFromCompany;

      // COGS = Purchases (company claims are treated as separate income, not cost reduction)
      const cogs = totalPurchases;

      // Gross Profit
      const grossProfit = totalRevenue - cogs;

      // Net Profit
      const netProfit = grossProfit - totalExpenses;

      // Get company names for the breakdown
      const companyIds = companyClaims.map((c) => c._id).filter((id) => id);
      const companies = await this.companyModel
        .find({ _id: { $in: companyIds } })
        .select("_id name")
        .exec();

      const companyMap = new Map(
        companies.map((c) => [c._id.toString(), c.name]),
      );

      console.log("DEBUG - companyClaims:", companyClaims);
      console.log("DEBUG - companyMap:", Array.from(companyMap.entries()));

      const result = {
        period: {
          startDate: finalStartDate,
          endDate: finalEndDate,
        },
        revenue: {
          salesRevenue: totalSalesValue,
          cashReceived: totalSRPayments,
          outstandingReceivables: totalOutstandingReceivables,
          total: totalRevenue,
        },
        cogs: {
          purchases: totalPurchases,
          netCOGS: cogs,
        },
        profitability: {
          grossProfit,
          operatingExpenses: totalExpenses,
          netProfit,
        },
        inventory: {
          currentValue: currentInventoryValue,
        },
        outstanding: {
          customerDues: totalOutstandingReceivables,
          supplierClaims: totalNetFromCompany,
        },
        byCompany: companyClaims.map((c) => ({
          companyId: c._id,
          companyName:
            companyMap.get(c._id?.toString() || "") || "Unknown Company",
          netFromCompany: c.totalNetFromCompany,
          totalDealerPrice: c.totalDealerPrice,
          totalCommission: c.totalCommission,
          totalSRPayment: c.totalSRPayment,
        })),
      };

      console.log("DEBUG - result.byCompany:", result.byCompany);
      return result;
    }
  }

  async getDueAmounts(companyId?: string) {
    // Calculate due from SRs
    // Due = Total issued amount - Total paid amount

    // First, get all SRs filtered by company if provided
    const srMatch: any = {};
    if (companyId) {
      srMatch.companyId = new Types.ObjectId(companyId);
    }

    const salesReps = await this.salesRepModel
      .find(srMatch)
      .select("_id name phone companyId")
      .exec();
    const srIds = salesReps.map((sr) => sr._id);

    if (srIds.length === 0) {
      // Return sample data for demonstration if no SRs found
      return {
        srDues: [
          {
            srId: "demo-sr-1",
            srName: "Demo Sales Rep",
            srPhone: "+8801712345678",
            totalIssued: 1000,
            totalPaid: 800,
            due: 200,
          },
        ],
      };
    }

    // Get all issues for these SRs
    const issues = await this.srIssueModel
      .find({ srId: { $in: srIds } })
      .select("srId totalAmount")
      .exec();

    // Group issues by SR
    const issuesBySR = new Map<string, number>();
    issues.forEach((issue) => {
      const srId = issue.srId.toString();
      const current = issuesBySR.get(srId) || 0;
      issuesBySR.set(srId, current + (issue.totalAmount || 0));
    });

    // Get all payments for these SRs
    const payments = await this.srPaymentModel
      .find({ srId: { $in: srIds } })
      .select("srId totalReceived")
      .exec();

    // Group payments by SR
    const paymentsBySR = new Map<string, number>();
    payments.forEach((payment) => {
      const srId = payment.srId.toString();
      const current = paymentsBySR.get(srId) || 0;
      paymentsBySR.set(srId, current + (payment.totalReceived || 0));
    });

    // Calculate dues
    let srDues = salesReps
      .map((sr) => {
        const srId = sr._id.toString();
        const totalIssued = issuesBySR.get(srId) || 0;
        const totalPaid = paymentsBySR.get(srId) || 0;
        const due = totalIssued - totalPaid;

        return {
          srId: srId,
          srName: (sr.name && sr.name.trim()) || "Unknown Sales Rep",
          srPhone: (sr.phone && sr.phone.trim()) || undefined,
          totalIssued,
          totalPaid,
          due,
        };
      })
      .filter((d) => d.totalIssued > 0 || d.totalPaid > 0);

    // If no real data found, return sample data for demonstration
    if (srDues.length === 0) {
      srDues = [
        {
          srId: "demo-sr-1",
          srName: "Demo Sales Rep",
          srPhone: "+8801712345678",
          totalIssued: 1000,
          totalPaid: 800,
          due: 200,
        },
      ];
    }

    return {
      srDues,
    };
  }

  // Floor Stock Report: Per product, per market/customer
  async getFloorStockReport(companyId?: string) {
    // Filter products by company if provided
    const productMatch: any = {};
    if (companyId) {
      // Try both ObjectId and string to handle different data types
      productMatch.$or = [
        { companyId: new Types.ObjectId(companyId) },
        { companyId: companyId },
      ];
    } else {
    }

    const products = await this.productModel
      .find(productMatch)
      .populate("companyId", "name code")
      .select("name sku companyId stock dealerPrice tradePrice unit")
      .exec();

    if (products.length === 0) {
      const totalProducts = await this.productModel.countDocuments().exec();
    }

    // Calculate floor stock value at DP price
    const floorStockData = products.map((p) => {
      const dealerPrice = p.dealerPrice || 0;
      const stock = p.stock || 0;
      const floorStockValue = stock * dealerPrice;

      return {
        productId: p._id,
        productName: p.name,
        sku: p.sku,
        company: p.companyId,
        stock,
        unit: p.unit,
        dealerPrice,
        tradePrice: p.tradePrice || 0,
        floorStockValue,
      };
    });

    // Group by company for summary
    const byCompany = new Map<
      string,
      { company: any; totalStock: number; totalValue: number }
    >();
    floorStockData.forEach((item) => {
      const companyIdStr =
        typeof item.company === "string"
          ? item.company
          : (item.company as any)?._id?.toString() || "";
      if (!byCompany.has(companyIdStr)) {
        byCompany.set(companyIdStr, {
          company: item.company,
          totalStock: 0,
          totalValue: 0,
        });
      }
      const companyData = byCompany.get(companyIdStr)!;
      companyData.totalStock += item.stock;
      companyData.totalValue += item.floorStockValue;
    });

    const totalStock = floorStockData.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = floorStockData.reduce(
      (sum, p) => sum + p.floorStockValue,
      0,
    );

    return {
      products: floorStockData,
      summary: Array.from(byCompany.values()),
      totalProducts: products.length,
      totalStock,
      totalValue,
    };
  }

  // Dues Report: Per customer (split: customerDue, companyClaim)
  async getDuesReport(companyId?: string) {
    // Get all payments with customer info and breakdown
    const paymentMatch: any = {};
    if (companyId) {
      // Filter payments by products from this company
      const companyProducts = await this.productModel
        .find({ companyId: new Types.ObjectId(companyId) })
        .select("_id")
        .exec();
      const productIds = companyProducts.map((p) => p._id.toString());

      // Get issues with these products
      const issues = await this.srIssueModel
        .find({ "items.productId": { $in: productIds } })
        .select("_id")
        .exec();
      const issueIds = issues.map((i) => i._id);

      paymentMatch.issueId = { $in: issueIds };
    }

    const payments = await this.srPaymentModel
      .find(paymentMatch)
      .populate("srId", "name phone")
      .populate("issueId", "issueNumber")
      .select(
        "customerInfo customerDue companyClaim receivedAmount issueId srId",
      )
      .exec();

    // Group by customer (using customerInfo.name or issueId as key)
    const duesByCustomer = new Map<
      string,
      {
        customerName: string;
        customerPhone?: string;
        customerAddress?: string;
        totalCustomerDue: number;
        totalCompanyClaim: number;
        totalReceived: number;
        paymentCount: number;
        payments: any[];
      }
    >();

    payments.forEach((payment) => {
      const customerName =
        payment.customerInfo?.name ||
        `Issue ${(payment.issueId as any)?.issueNumber || "Unknown"}`;
      const customerKey =
        payment.customerInfo?.name || payment.issueId?.toString() || "unknown";

      if (!duesByCustomer.has(customerKey)) {
        duesByCustomer.set(customerKey, {
          customerName,
          customerPhone: payment.customerInfo?.phone,
          customerAddress: payment.customerInfo?.address,
          totalCustomerDue: 0,
          totalCompanyClaim: 0,
          totalReceived: 0,
          paymentCount: 0,
          payments: [],
        });
      }

      const customerData = duesByCustomer.get(customerKey)!;
      customerData.totalCustomerDue += payment.customerDue || 0;
      customerData.totalCompanyClaim += payment.companyClaim || 0;
      customerData.totalReceived += payment.receivedAmount || 0;
      customerData.paymentCount += 1;
      customerData.payments.push({
        issueId: payment.issueId,
        receivedAmount: payment.receivedAmount || 0,
        customerDue: payment.customerDue || 0,
        companyClaim: payment.companyClaim || 0,
      });
    });

    return {
      customers: Array.from(duesByCustomer.values()),
      totalCustomerDue: Array.from(duesByCustomer.values()).reduce(
        (sum, c) => sum + c.totalCustomerDue,
        0,
      ),
      totalCompanyClaim: Array.from(duesByCustomer.values()).reduce(
        (sum, c) => sum + c.totalCompanyClaim,
        0,
      ),
      totalReceived: Array.from(duesByCustomer.values()).reduce(
        (sum, c) => sum + c.totalReceived,
        0,
      ),
    };
  }

  // Daily Financial Summary: Collections (by payment method) and company-issued product values
  async getFinancialOverview(companyId?: string) {
    // Get all financial data in parallel with multi-tenant filtering
    const [floorStock, _dueAmounts, companyClaims] = await Promise.all([
      this.getFloorStockReport(companyId),
      this.getDueAmounts(companyId),
      this.getPendingCompanyClaims(companyId),
    ]);

    // Return sample data for demonstration
    // TODO: Replace with real calculated data
    const sampleCustomerDues = {
      srDues: [
        {
          srId: "sample-sr-1",
          srName: "Sayman Rabbi",
          srPhone: "+8801712345678",
          totalIssued: 85000,
          totalPaid: 75000,
          due: 10000,
        },
      ],
    };

    // Add sample floor stock if none found
    const sampleFloorStock =
      floorStock.products.length === 0
        ? {
            products: [
              {
                productId: "sample-1",
                productName: "Sample Product 1",
                sku: "SP001",
                company: { name: "Sample Company" },
                stock: 100,
                unit: "pcs",
                tradePrice: 50,
                floorStockValue: 5000,
              },
              {
                productId: "sample-2",
                productName: "Sample Product 2",
                sku: "SP002",
                company: { name: "Sample Company" },
                stock: 200,
                unit: "pcs",
                tradePrice: 30,
                floorStockValue: 6000,
              },
            ],
            summary: [
              {
                company: { name: "Sample Company" },
                totalStock: 300,
                totalValue: 11000,
              },
            ],
            totalProducts: 2,
            totalStock: 300,
            totalValue: 11000,
          }
        : floorStock;

    return {
      floorStock: sampleFloorStock,
      customerDues: sampleCustomerDues,
      companyClaims,
    };
  }

  async getMonthlyReport(companyId?: string, startDate?: Date, endDate?: Date) {
    // If no dates provided, default to last 6 months
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 months ago
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Start of next month

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Get floor stock data once (not period-based)
    const floorStockData = await this.getFloorStockReport(companyId);

    // Get pending claims data
    const pendingClaimsData = await this.getPendingCompanyClaims(companyId);

    // Generate monthly data within the date range
    const monthlyData = [];
    const startYear = finalStartDate.getFullYear();
    const startMonth = finalStartDate.getMonth();
    const endYear = finalEndDate.getFullYear();
    const endMonth = finalEndDate.getMonth();

    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 0;
      const monthEnd = year === endYear ? endMonth : 11;

      for (let month = monthStart; month <= monthEnd; month++) {
        // Create dates in local timezone to avoid UTC conversion issues
        // Use 1st day of month at start of day
        const monthStartDate = new Date(year, month, 1, 0, 0, 0, 0);
        // Use 1st day of next month at start of day (which is the end of current month)
        const monthEndDate = new Date(year, month + 1, 1, 0, 0, 0, 0);

        // Format period safely without timezone conversion
        const periodYear = monthStartDate.getFullYear();
        const periodMonth = String(monthStartDate.getMonth() + 1).padStart(
          2,
          "0",
        );
        const period = `${periodYear}-${periodMonth}`;

        // Get data for this month
        const [
          salesData,
          expenseData,
          supplierPaymentData,
          inventoryData,
          duesData,
        ] = await Promise.all([
          this.getSalesForPeriod(companyId, monthStartDate, monthEndDate),
          this.getExpensesForPeriod(companyId, monthStartDate, monthEndDate),
          this.getSupplierPaymentsForPeriod(
            companyId,
            monthStartDate,
            monthEndDate,
          ),
          this.getInventoryReceivedForPeriod(
            companyId,
            monthStartDate,
            monthEndDate,
          ),
          this.getCustomerDuesForPeriod(
            companyId,
            monthStartDate,
            monthEndDate,
          ),
        ]);

        // Calculate COGS: Cost of Goods Sold
        // COGS = (Inventory Received × Sales Value) ÷ Inventory Received = Sales Value (if all inventory sold)
        // But if inventory received > sales, then COGS = sales value (assuming FIFO or average cost)
        // For simplicity: COGS = min(sales value, inventory received value)
        const cogs = Math.min(salesData.totalSales, inventoryData.totalValue);

        monthlyData.push({
          period: period,
          totalSales: salesData.totalSales,
          totalExpenses: expenseData.total,
          totalSupplierPayments: supplierPaymentData.total,
          customerDues: duesData.totalCustomerDue,
          floorStockValue: floorStockData.totalValue,
          netProfit: salesData.totalSales - cogs - expenseData.total,
          salesCount: salesData.count,
          customerCount: duesData.customerCount,
          productCount: floorStockData.totalProducts,
        });
      }
    }

    // If no months found (date range too narrow), generate last 6 months
    if (monthlyData.length === 0) {
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [
          salesData,
          expenseData,
          supplierPaymentData,
          inventoryData,
          duesData,
        ] = await Promise.all([
          this.getSalesForPeriod(companyId, monthStart, monthEnd),
          this.getExpensesForPeriod(companyId, monthStart, monthEnd),
          this.getSupplierPaymentsForPeriod(companyId, monthStart, monthEnd),
          this.getInventoryReceivedForPeriod(companyId, monthStart, monthEnd),
          this.getCustomerDuesForPeriod(companyId, monthStart, monthEnd),
        ]);

        // Calculate COGS for fallback data too
        const cogs = Math.min(salesData.totalSales, inventoryData.totalValue);

        monthlyData.push({
          period: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          totalSales: salesData.totalSales,
          totalExpenses: expenseData.total,
          totalSupplierPayments: supplierPaymentData.total,
          customerDues: duesData.totalCustomerDue,
          floorStockValue: floorStockData.totalValue,
          netProfit: salesData.totalSales - cogs - expenseData.total,
          salesCount: salesData.count,
          customerCount: duesData.customerCount,
          productCount: floorStockData.totalProducts,
        });
      }
    }

    // Get current month data
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const previousMonthData =
      monthlyData[monthlyData.length - 2] || currentMonthData;

    // Debug: Log what data we found

    // Check if we have any real transaction data
    const hasAnyTransactionData = monthlyData.some(
      (m) => m.totalSales > 0 || m.totalExpenses > 0 || m.customerDues > 0,
    );

    // Check if we have products (real business setup)
    const hasProducts = floorStockData.totalProducts > 0;

    // Only show sample data if there are no products AND no transactions
    // If there are products but no transactions, show zeros (real empty state)
    if (!hasAnyTransactionData && !hasProducts) {
      const sampleMonthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(finalStartDate);
        monthDate.setMonth(monthDate.getMonth() - i);
        const period = monthDate.toISOString().slice(0, 7);

        const salesValue = Math.floor(Math.random() * 50000) + 20000;
        const inventoryValue = Math.floor(Math.random() * 40000) + 15000;
        const cogs = Math.min(salesValue, inventoryValue);

        sampleMonthlyData.push({
          period,
          totalSales: salesValue,
          totalExpenses: Math.floor(Math.random() * 15000) + 8000,
          totalSupplierPayments: Math.floor(Math.random() * 30000) + 10000,
          customerDues: Math.floor(Math.random() * 8000) + 2000,
          floorStockValue: 35000 + Math.floor(Math.random() * 15000),
          netProfit: salesValue - cogs, // Simplified: Sales - COGS (no expenses in sample)
          salesCount: Math.floor(Math.random() * 50) + 20,
          customerCount: Math.floor(Math.random() * 20) + 10,
          productCount: 25 + Math.floor(Math.random() * 10),
        });
      }

      // Recalculate profits for sample data (already calculated above)
      // Profits are now calculated as Sales - COGS - Expenses
      sampleMonthlyData.forEach((m) => {
        const cogs = Math.min(
          m.totalSales,
          Math.floor(Math.random() * 40000) + 15000,
        ); // Simulate inventory value
        m.netProfit = m.totalSales - cogs - m.totalExpenses;
      });

      const currentSample = sampleMonthlyData[sampleMonthlyData.length - 1];
      const previousSample = sampleMonthlyData[sampleMonthlyData.length - 2];

      const salesGrowth =
        previousSample.totalSales > 0
          ? ((currentSample.totalSales - previousSample.totalSales) /
              previousSample.totalSales) *
            100
          : 0;
      const expenseGrowth =
        previousSample.totalExpenses > 0
          ? ((currentSample.totalExpenses - previousSample.totalExpenses) /
              previousSample.totalExpenses) *
            100
          : 0;
      const profitGrowth =
        previousSample.netProfit !== 0
          ? ((currentSample.netProfit - previousSample.netProfit) /
              Math.abs(previousSample.netProfit)) *
            100
          : 0;

      return {
        currentMonth: currentSample,
        previousMonth: previousSample,
        growth: {
          salesGrowth,
          expenseGrowth,
          profitGrowth,
        },
        monthlyData: sampleMonthlyData,
        totalPendingClaims: Math.floor(Math.random() * 50000) + 10000, // Sample pending claims
      };
    }

    // Calculate growth for real data
    const salesGrowth =
      previousMonthData.totalSales > 0
        ? ((currentMonthData.totalSales - previousMonthData.totalSales) /
            previousMonthData.totalSales) *
          100
        : 0;
    const expenseGrowth =
      previousMonthData.totalExpenses > 0
        ? ((currentMonthData.totalExpenses - previousMonthData.totalExpenses) /
            previousMonthData.totalExpenses) *
          100
        : 0;
    const profitGrowth =
      previousMonthData.netProfit !== 0
        ? ((currentMonthData.netProfit - previousMonthData.netProfit) /
            Math.abs(previousMonthData.netProfit)) *
          100
        : 0;

    return {
      currentMonth: currentMonthData,
      previousMonth: previousMonthData,
      growth: {
        salesGrowth,
        expenseGrowth,
        profitGrowth,
      },
      monthlyData,
      totalPendingClaims: pendingClaimsData.totalPendingClaims,
    };
  }

  private async getSalesForPeriod(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const matchConditions: any = {};
    if (startDate && endDate) {
      matchConditions.issueDate = { $gte: startDate, $lte: endDate };
    }

    const pipeline: any[] = [
      { $match: matchConditions },
      // Join with SalesRep to get company info
      // Try both ObjectId and string matching
      {
        $lookup: {
          from: "salesreps",
          let: { srId: "$srId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$srId"] },
                    { $eq: ["$_id", { $toObjectId: "$$srId" }] },
                  ],
                },
              },
            },
          ],
          as: "srInfo",
        },
      },
      // Unwind the srInfo array (should have 1 item)
      { $unwind: "$srInfo" },
      // Filter by company if specified
      ...(companyId
        ? [
            {
              $match: {
                "srInfo.companyId": companyId,
              },
            },
          ]
        : []),
    ];

    // Debug: Check documents after lookup and company filter
    const debugPipeline = [
      ...pipeline,
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sampleDocs: {
            $push: {
              _id: "$_id",
              srId: "$srId",
              srCompanyId: "$srInfo.companyId",
              itemsCount: { $size: "$items" },
            },
          },
        },
      },
    ];

    // Debug: Check what happens at each stage
    // 1. Just date filter
    const stage1 = await this.srIssueModel.aggregate([
      { $match: matchConditions },
      { $count: "stage1_count" },
    ]);

    // 2. After lookup
    const stage2 = await this.srIssueModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "salesreps",
          localField: "srId",
          foreignField: "_id",
          as: "srInfo",
        },
      },
      { $count: "stage2_count" },
    ]);

    // 3. Check what srInfo contains (before unwind) and also check what sales reps exist
    const stage3 = await this.srIssueModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "salesreps",
          localField: "srId",
          foreignField: "_id",
          as: "srInfo",
        },
      },
      { $limit: 3 }, // Just check first 3
      {
        $project: {
          _id: 1,
          srId: 1,
          srInfo: 1,
        },
      },
    ]);

    // Also check what sales reps exist in the database
    const allSalesReps = await this.salesRepModel.find({}).limit(10);

    // 4. After checking for non-empty srInfo
    const stage4 = await this.srIssueModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "salesreps",
          localField: "srId",
          foreignField: "_id",
          as: "srInfo",
        },
      },
      { $match: { srInfo: { $ne: [] } } }, // Only docs where lookup found something
      { $count: "stage4_count" },
    ]);

    // Execute debug pipeline to see documents after lookup/company filter
    const debugResult = await this.srIssueModel.aggregate(debugPipeline);

    // Add unwind and final group to main pipeline
    pipeline.push(
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: { $multiply: ["$items.quantity", "$items.tradePrice"] },
          },
          count: { $sum: 1 },
        },
      },
    );

    const sales = await this.srIssueModel.aggregate(pipeline);

    const salesResult = await this.srIssueModel.aggregate(pipeline);

    // Also check raw SR issues in this date range
    const rawIssues = await this.srIssueModel
      .find({
        issueDate: { $gte: startDate, $lte: endDate },
      })
      .populate("srId")
      .limit(5);

    // Check if the SR belongs to the right company
    const targetCompanyId = "6952be28ed9c95d9d860fe54"; // From the logs
    const issuesWithCompanyMatch = rawIssues.filter(
      (i) => (i.srId as any)?.companyId?.toString() === targetCompanyId,
    );

    return {
      totalSales: salesResult.length > 0 ? salesResult[0].totalSales || 0 : 0,
      count: salesResult.length > 0 ? salesResult[0].count || 0 : 0,
    };
  }

  private async getExpensesForPeriod(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const matchConditions: any = {};
    if (companyId) {
      matchConditions.companyId = companyId;
    }
    if (startDate && endDate) {
      matchConditions.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await this.expenseModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return {
      total: expenses.length > 0 ? expenses[0].total || 0 : 0,
    };
  }

  private async getSupplierPaymentsForPeriod(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const matchConditions: any = {};
    if (startDate && endDate) {
      matchConditions.paymentDate = { $gte: startDate, $lte: endDate };
    }

    // SupplierPayment has direct companyId field, no complex joins needed
    if (companyId) {
      matchConditions.companyId = companyId; // Keep as string
    }

    const payments = await this.supplierPaymentModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Also check raw supplier payments
    const rawPayments = await this.supplierPaymentModel
      .find({
        paymentDate: { $gte: startDate, $lte: endDate },
      })
      .limit(5);

    // Check which payments match the company
    const paymentsMatchingCompany = rawPayments.filter(
      (p) => p.companyId?.toString() === companyId,
    );

    return {
      total: payments.length > 0 ? payments[0].total || 0 : 0,
    };
  }

  private async getInventoryReceivedForPeriod(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const matchConditions: any = {};
    if (startDate && endDate) {
      matchConditions.receiptDate = { $gte: startDate, $lte: endDate };
    }

    // Supplier receipts have companyId - try both ObjectId and string
    if (companyId) {
      matchConditions.$or = [
        { companyId: new Types.ObjectId(companyId) },
        { companyId: companyId },
      ];
    }

    const receipts = await this.supplierReceiptModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$totalValue" },
        },
      },
    ]);

    // Also try a simple find to see if data exists
    const allReceipts = await this.supplierReceiptModel
      .find(matchConditions)
      .limit(5);

    return {
      totalValue: receipts.length > 0 ? receipts[0].totalValue || 0 : 0,
    };
  }

  private async getCustomerDuesForPeriod(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Get SR payments with customer info within the date range
    const paymentMatch: any = {};
    // TEMP: Skip date filtering for debugging

    if (companyId) {
      // Filter payments by products from this company
      const companyProducts = await this.productModel
        .find({
          $or: [
            { companyId: new Types.ObjectId(companyId) },
            { companyId: companyId },
            { "companyId._id": companyId },
          ],
        })
        .select("_id")
        .exec();

      const productIds = companyProducts.map((p) => p._id.toString());

      if (productIds.length > 0) {
        paymentMatch["items.productId"] = { $in: productIds };
      } else {
        // No products for this company, return empty result

        return {
          totalCustomerDue: 0,
          customerCount: 0,
        };
      }
    } else {
    }

    const payments = await this.srPaymentModel
      .find(paymentMatch)
      .sort({ paymentDate: -1 })
      .exec();

    // Filter payments that have customer info and calculate dues
    const paymentsWithCustomerInfo = payments.filter(
      (payment) => payment.customerInfo?.name,
    );

    // Group by customer and sum dues
    const customerDues = new Map<
      string,
      { name: string; phone: string; totalDue: number; payments: any[] }
    >();

    paymentsWithCustomerInfo.forEach((payment) => {
      if (!payment.customerInfo?.name) return;

      const customerKey = `${payment.customerInfo.name}-${payment.customerInfo.phone || ""}`;

      if (!customerDues.has(customerKey)) {
        customerDues.set(customerKey, {
          name: payment.customerInfo.name,
          phone: payment.customerInfo.phone || "",
          totalDue: 0,
          payments: [],
        });
      }

      const customer = customerDues.get(customerKey)!;
      customer.totalDue += payment.customerDue || 0;
      customer.payments.push(payment);
    });

    const customersArray = Array.from(customerDues.values());
    const totalCustomerDue = customersArray.reduce(
      (sum, customer) => sum + customer.totalDue,
      0,
    );

    return {
      totalCustomerDue,
      customerCount: customersArray.length,
    };
  }

  async getPendingCompanyClaims(companyId?: string) {
    // Get all pending company claims (what companies owe us)
    const claimMatch: any = {
      status: { $in: ["pending", "approved"] }, // Claims that haven't been paid yet
    };

    if (companyId) {
      claimMatch.companyId = companyId; // Keep as string, not ObjectId
    }

    // Get claims and company info separately to avoid object ID issues
    const claims = await this.companyClaimModel
      .find(claimMatch)
      .select(
        "companyId totalCompanyClaim totalDealerPrice netFromCompany status",
      )
      .exec();

    if (claims.length > 0) {
    } else {
      // Check claims without company filter
      const allClaims = await this.companyClaimModel
        .find({ status: { $in: ["pending", "approved"] } })
        .limit(5);
    }

    if (claims.length === 0) {
      const totalClaims = await this.companyClaimModel.countDocuments().exec();

      // Check what statuses exist
      const statusCounts = await this.companyClaimModel
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .exec();

      return {
        companies: [],
        totalPendingClaims: 0,
        totalClaimCount: 0,
      };
    }

    // Get unique company IDs
    const companyIds = [
      ...new Set(claims.map((c) => c.companyId?.toString()).filter(Boolean)),
    ];

    // Get company details
    const companies = await this.companyModel
      .find({ _id: { $in: companyIds } })
      .select("_id name code")
      .exec();

    const companyMap = new Map(
      companies.map((c) => [c._id.toString(), { name: c.name, code: c.code }]),
    );

    // Group claims by company
    const claimsByCompany = new Map<
      string,
      {
        companyId: string;
        companyName: string;
        totalClaims: number;
        pendingAmount: number;
        claimCount: number;
      }
    >();

    claims.forEach((claim) => {
      // Handle companyId which might be an object or string
      const companyObj = claim.companyId as any;
      let companyId: string;
      let companyName: string;

      if (typeof companyObj === "object" && companyObj?._id) {
        // It's an object with _id field
        companyId = companyObj._id.toString();
        companyName = companyObj.name || "Unknown Company";
      } else {
        // It's a string ID
        companyId = companyObj?.toString() || "unknown";
        const companyInfo = companyMap.get(companyId);
        companyName = companyInfo?.name || "Unknown Company";
      }

      const existing = claimsByCompany.get(companyId) || {
        companyId,
        companyName,
        totalClaims: 0,
        pendingAmount: 0,
        claimCount: 0,
      };

      existing.totalClaims += claim.totalCompanyClaim || 0;
      existing.pendingAmount +=
        claim.netFromCompany || claim.totalCompanyClaim || 0;
      existing.claimCount += 1;

      claimsByCompany.set(companyId, existing);
    });

    const companyClaims = Array.from(claimsByCompany.values());

    return {
      companies: companyClaims,
      totalPendingClaims: companyClaims.reduce(
        (sum, c) => sum + c.pendingAmount,
        0,
      ),
      totalClaimCount: claims.length,
    };
  }

  async getDailyFinancialSummary(
    startDate?: Date,
    endDate?: Date,
    companyId?: string,
  ) {
    const start = startDate || new Date(0);
    const end = endDate || new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const paymentMatch: any = {
      paymentDate: { $gte: start, $lte: end },
    };

    const issueMatch: any = {
      issueDate: { $gte: start, $lte: end },
    };

    if (companyId) {
      // Filter by products from this company
      const companyProducts = await this.productModel
        .find({ companyId: new Types.ObjectId(companyId) })
        .select("_id")
        .exec();
      const productIds = companyProducts.map((p) => p._id.toString());

      // Get issues with these products
      const issues = await this.srIssueModel
        .find({ "items.productId": { $in: productIds } })
        .select("_id")
        .exec();
      const issueIds = issues.map((i) => i._id);

      paymentMatch.issueId = { $in: issueIds };
      issueMatch._id = { $in: issueIds };
    }

    // Get all payments in date range
    const payments = await this.srPaymentModel
      .find(paymentMatch)
      .select("paymentDate paymentMethod receivedAmount totalReceived")
      .exec();

    // Get all supplier payments (money going out)
    const supplierPayments = await this.supplierPaymentModel
      .find(
        companyId
          ? {
              companyId: new Types.ObjectId(companyId),
              paymentDate: { $gte: start, $lte: end },
            }
          : { paymentDate: { $gte: start, $lte: end } },
      )
      .select("paymentDate paymentMethod amount")
      .exec();

    // Get all supplier receipts (products coming in)
    const supplierReceipts = await this.supplierReceiptModel
      .find(
        companyId
          ? {
              companyId: new Types.ObjectId(companyId),
              receiptDate: { $gte: start, $lte: end },
            }
          : { receiptDate: { $gte: start, $lte: end } },
      )
      .select("receiptDate totalValue")
      .exec();

    // Get all issues (company-issued products) in date range
    const issues = await this.srIssueModel
      .find(issueMatch)
      .select("issueDate totalAmount items")
      .populate("items.productId", "tradePrice")
      .exec();

    // Group by date
    const dateMap = new Map<
      string,
      {
        date: string;
        collections: {
          cash: number;
          bank: number;
          bkash: number;
          nagad: number;
          rocket: number;
          other: number;
          total: number;
        };
        supplierPayments: {
          cash: number;
          bank: number;
          bkash: number;
          nagad: number;
          rocket: number;
          online: number;
          other: number;
          total: number;
        };
        supplierReceipts: number; // Value of products received from suppliers
        productIssued: number; // Value at TP
        productIssuedCount: number; // Number of issues
      }
    >();

    // Process customer payments (money coming in)
    payments.forEach((payment) => {
      const dateKey = new Date(payment.paymentDate).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          collections: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            other: 0,
            total: 0,
          },
          supplierPayments: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            online: 0,
            other: 0,
            total: 0,
          },
          supplierReceipts: 0,
          productIssued: 0,
          productIssuedCount: 0,
        });
      }

      const dayData = dateMap.get(dateKey)!;
      const amount = payment.receivedAmount || payment.totalReceived || 0;
      const method = (payment.paymentMethod || "other").toLowerCase();

      if (method === "cash") {
        dayData.collections.cash += amount;
      } else if (method === "bank") {
        dayData.collections.bank += amount;
      } else if (method === "bkash") {
        dayData.collections.bkash += amount;
      } else if (method === "nagad") {
        dayData.collections.nagad += amount;
      } else if (method === "rocket") {
        dayData.collections.rocket += amount;
      } else {
        dayData.collections.other += amount;
      }
      dayData.collections.total += amount;
    });

    // Process supplier payments (money going out)
    supplierPayments.forEach((payment) => {
      const dateKey = new Date(payment.paymentDate).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          collections: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            other: 0,
            total: 0,
          },
          supplierPayments: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            online: 0,
            other: 0,
            total: 0,
          },
          supplierReceipts: 0,
          productIssued: 0,
          productIssuedCount: 0,
        });
      }

      const dayData = dateMap.get(dateKey)!;
      const amount = payment.amount || 0;
      const method = (payment.paymentMethod || "other").toLowerCase();

      if (method === "cash") {
        dayData.supplierPayments.cash += amount;
      } else if (method === "bank") {
        dayData.supplierPayments.bank += amount;
      } else if (method === "bkash") {
        dayData.supplierPayments.bkash += amount;
      } else if (method === "nagad") {
        dayData.supplierPayments.nagad += amount;
      } else if (method === "rocket") {
        dayData.supplierPayments.rocket += amount;
      } else if (method === "online") {
        dayData.supplierPayments.online += amount;
      } else {
        dayData.supplierPayments.other += amount;
      }
      dayData.supplierPayments.total += amount;
    });

    // Process supplier receipts (products coming from suppliers - inflow)
    supplierReceipts.forEach((receipt) => {
      const dateKey = new Date(receipt.receiptDate).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          collections: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            other: 0,
            total: 0,
          },
          supplierPayments: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            online: 0,
            other: 0,
            total: 0,
          },
          supplierReceipts: 0,
          productIssued: 0,
          productIssuedCount: 0,
        });
      }

      const dayData = dateMap.get(dateKey)!;
      dayData.supplierReceipts += receipt.totalValue;
    });

    // Process issues (company-issued products)
    issues.forEach((issue) => {
      const dateKey = new Date(issue.issueDate).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          collections: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            other: 0,
            total: 0,
          },
          supplierPayments: {
            cash: 0,
            bank: 0,
            bkash: 0,
            nagad: 0,
            rocket: 0,
            online: 0,
            other: 0,
            total: 0,
          },
          supplierReceipts: 0,
          productIssued: 0,
          productIssuedCount: 0,
        });
      }

      const dayData = dateMap.get(dateKey)!;

      // Calculate value at TP
      let issueValue = 0;
      let totalProductsIssued = 0;
      issue.items.forEach((item) => {
        const tradePrice = item.tradePrice || 0;
        issueValue += item.quantity * tradePrice;
        totalProductsIssued += item.quantity;
      });

      dayData.productIssued += issueValue;
      dayData.productIssuedCount += totalProductsIssued;
    });

    // Convert to array and sort by date
    const summary = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // If no real data found, return sample data for demonstration
    if (summary.length === 0) {
      const sampleSummary = [];
      const daysInPeriod = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (let i = 0; i < Math.min(daysInPeriod, 7); i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);

        sampleSummary.push({
          date: date.toISOString().split("T")[0],
          collections: {
            cash: Math.floor(Math.random() * 10000) + 5000,
            bank: Math.floor(Math.random() * 8000) + 3000,
            bkash: Math.floor(Math.random() * 5000) + 1000,
            nagad: Math.floor(Math.random() * 3000) + 500,
            rocket: Math.floor(Math.random() * 2000) + 200,
            other: Math.floor(Math.random() * 1000) + 100,
            total: 0, // Will be calculated
          },
          supplierPayments: {
            cash: Math.floor(Math.random() * 6000) + 2000,
            bank: Math.floor(Math.random() * 4000) + 1000,
            bkash: Math.floor(Math.random() * 2000) + 300,
            nagad: Math.floor(Math.random() * 1500) + 200,
            rocket: Math.floor(Math.random() * 1000) + 100,
            online: Math.floor(Math.random() * 3000) + 500,
            other: Math.floor(Math.random() * 800) + 100,
            total: 0, // Will be calculated
          },
          supplierReceipts: Math.floor(Math.random() * 8000) + 2000,
          productIssued: Math.floor(Math.random() * 15000) + 5000,
          productIssuedCount: Math.floor(Math.random() * 20) + 5,
        });

        // Calculate totals
        const day = sampleSummary[sampleSummary.length - 1];
        day.collections.total =
          day.collections.cash +
          day.collections.bank +
          day.collections.bkash +
          day.collections.nagad +
          day.collections.rocket +
          day.collections.other;
        day.supplierPayments.total =
          day.supplierPayments.cash +
          day.supplierPayments.bank +
          day.supplierPayments.bkash +
          day.supplierPayments.nagad +
          day.supplierPayments.rocket +
          day.supplierPayments.online +
          day.supplierPayments.other;
      }

      return {
        summary: sampleSummary,
        totalCollections: sampleSummary.reduce(
          (sum, day) => sum + day.collections.total,
          0,
        ),
        totalSupplierPayments: sampleSummary.reduce(
          (sum, day) => sum + day.supplierPayments.total,
          0,
        ),
        totalSupplierReceipts: sampleSummary.reduce(
          (sum, day) => sum + day.supplierReceipts,
          0,
        ),
        totalProductIssued: sampleSummary.reduce(
          (sum, day) => sum + day.productIssued,
          0,
        ),
        totalIssues: sampleSummary.reduce(
          (sum, day) => sum + day.productIssuedCount,
          0,
        ),
      };
    }

    return {
      summary,
      totalCollections: summary.reduce(
        (sum, day) => sum + day.collections.total,
        0,
      ),
      totalSupplierPayments: summary.reduce(
        (sum, day) => sum + day.supplierPayments.total,
        0,
      ),
      totalSupplierReceipts: summary.reduce(
        (sum, day) => sum + day.supplierReceipts,
        0,
      ),
      totalProductIssued: summary.reduce(
        (sum, day) => sum + day.productIssued,
        0,
      ),
      totalIssues: summary.reduce(
        (sum, day) => sum + day.productIssuedCount,
        0,
      ),
    };
  }

  // Pending Deliveries: Products issued but not yet paid for
  async getPendingDeliveries(
    companyId?: string,
    page: number = 1,
    limit: number = 10,
    timePeriod: "all" | "week" | "month" | "year" = "all",
  ) {
    const issuesQuery: any = {};
    if (companyId) {
      const companyProducts = await this.productModel
        .find({
          $or: [
            { companyId: new Types.ObjectId(companyId) },
            { companyId: companyId },
          ],
        })
        .select("_id")
        .exec();
      const productIdStrings = companyProducts.map((p) => p._id.toString());
      issuesQuery["items.productId"] = { $in: productIdStrings };
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
        dateFilter.issueDate = { $gte: startOfWeek, $lte: endOfWeek };
        break;
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        dateFilter.issueDate = { $gte: startOfMonth, $lte: endOfMonth };
        break;
      case "year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        dateFilter.issueDate = { $gte: startOfYear, $lte: endOfYear };
        break;
      case "all":
      default:
        // No date filter for "all"
        break;
    }

    if (Object.keys(dateFilter).length > 0) {
      issuesQuery.issueDate = dateFilter.issueDate;
    }

    // Pipeline to find all issues, then filter by payment status
    const pipeline: any[] = [
      { $match: issuesQuery },
      {
        $lookup: {
          from: "srpayments",
          let: { issueId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$issueId" }, { $toString: "$$issueId" }],
                },
              },
            },
          ],
          as: "payments",
        },
      },
      {
        $addFields: {
          totalReceived: {
            $sum: "$payments.receivedAmount",
          },
        },
      },
      {
        $match: {
          $or: [
            { payments: { $size: 0 } }, // No payments at all
            {
              $expr: {
                $gt: [
                  {
                    $subtract: [
                      "$totalAmount",
                      { $ifNull: ["$totalReceived", 0] },
                    ],
                  },
                  0.01,
                ],
              },
            },
          ],
        },
      },
      { $sort: { issueDate: -1 } }, // Sort by issue date descending
    ];

    // Get total count of pending issues before pagination
    const totalCountResult = await this.srIssueModel.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);

    const totalItems =
      totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Add pagination stages to the pipeline
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "salesreps",
          let: { srId: "$srId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$srId" }],
                },
              },
            },
          ],
          as: "srInfo",
        },
      },
      {
        $lookup: {
          from: "products",
          let: { productIds: "$items.productId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$_id",
                    {
                      $map: {
                        input: "$$productIds",
                        as: "pid",
                        in: { $toObjectId: "$$pid" },
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "productInfo",
        },
      },
      {
        $project: {
          issueNumber: 1,
          issueDate: 1,
          srId: {
            $cond: {
              if: { $gt: [{ $size: "$srInfo" }, 0] },
              then: { $arrayElemAt: ["$srInfo._id", 0] },
              else: "$srId",
            },
          },
          srName: {
            $cond: {
              if: { $gt: [{ $size: "$srInfo" }, 0] },
              then: { $arrayElemAt: ["$srInfo.name", 0] },
              else: "Unknown SR",
            },
          },
          srPhone: {
            $cond: {
              if: { $gt: [{ $size: "$srInfo" }, 0] },
              then: { $arrayElemAt: ["$srInfo.phone", 0] },
              else: "",
            },
          },
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                productId: "$$item.productId",
                productName: {
                  $arrayElemAt: [
                    "$productInfo.name",
                    { $indexOfArray: ["$productInfo._id", "$$item.productId"] },
                  ],
                },
                sku: {
                  $arrayElemAt: [
                    "$productInfo.sku",
                    { $indexOfArray: ["$productInfo._id", "$$item.productId"] },
                  ],
                },
                unit: {
                  $arrayElemAt: [
                    "$productInfo.unit",
                    { $indexOfArray: ["$productInfo._id", "$$item.productId"] },
                  ],
                },
                quantity: "$$item.quantity",
                dealerPrice: "$$item.dealerPrice",
                tradePrice: "$$item.tradePrice",
                totalValue: {
                  $multiply: ["$$item.quantity", "$$item.tradePrice"],
                },
              },
            },
          },
        },
      },
    );

    const paginatedIssues = await this.srIssueModel.aggregate(pipeline);

    const pendingDeliveries: any[] = [];
    for (const issue of paginatedIssues) {
      // Group by SR for better display - simplified for now
      // This structure is similar to the old implementation but with already populated data
      pendingDeliveries.push({
        issueId: issue._id,
        issueNumber: issue.issueNumber,
        issueDate: issue.issueDate,
        srId: issue.srId,
        srName: issue.srName || "Unknown SR",
        srPhone: issue.srPhone || "",
        deliveries: issue.items, // Now contains product details
        totalItems: issue.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0,
        ),
        totalValue: issue.items.reduce(
          (sum: number, item: any) => sum + item.totalValue,
          0,
        ),
      });
    }

    const result = {
      pendingDeliveries: pendingDeliveries,
      totalPendingItems: pendingDeliveries.reduce(
        (sum, d) => sum + d.totalItems,
        0,
      ),
      totalPendingValue: pendingDeliveries.reduce(
        (sum, d) => sum + d.totalValue,
        0,
      ),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return result;
  }

  // Product History: Date-wise movements for a specific product
  async getProductHistory(productId: string, startDate?: Date, endDate?: Date) {
    const product = await this.productModel
      .findById(productId)
      .select("_id name sku tradePrice unit")
      .exec();

    if (!product) {
      return { history: [], product: null };
    }

    // Set date range
    const start = startDate || new Date(0); // Beginning of time if not specified
    const end = endDate || new Date(); // Today if not specified
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get issues (deliveries) for this product
    const issues = await this.srIssueModel
      .find({
        $or: [
          { "items.productId": new Types.ObjectId(productId) },
          { "items.productId": productId },
        ],
        issueDate: { $gte: start, $lte: end },
      })
      .populate("srId", "name phone")
      .select("issueDate items srId")
      .exec();

    // Get payments (sales) for this product
    const payments = await this.srPaymentModel
      .find({
        $or: [
          { "items.productId": new Types.ObjectId(productId) },
          { "items.productId": productId },
        ],
        paymentDate: { $gte: start, $lte: end },
      })
      .populate("srId", "name phone")
      .select("paymentDate items srId")
      .exec();

    // Get customer returns for this product
    const customerReturns = await this.productReturnModel
      .find({
        $or: [
          { "items.productId": new Types.ObjectId(productId) },
          { "items.productId": productId },
        ],
        returnDate: { $gte: start, $lte: end },
        returnType: ReturnType.CUSTOMER_RETURN,
      })
      .populate("srId", "name phone")
      .select("returnDate items srId")
      .exec();

    // Get damage returns for this product
    const damageReturns = await this.productReturnModel
      .find({
        $or: [
          { "items.productId": new Types.ObjectId(productId) },
          { "items.productId": productId },
        ],
        returnDate: { $gte: start, $lte: end },
        returnType: ReturnType.DAMAGE_RETURN,
      })
      .populate("srId", "name phone")
      .select("returnDate items srId")
      .exec();

    // Combine all transactions and sort by date
    const allTransactions = [
      ...issues.map((issue) => ({
        date: issue.issueDate,
        type: "issued",
        quantity:
          issue.items.find(
            (item: any) => item.productId.toString() === productId,
          )?.quantity || 0,
        srName: (issue.srId as any)?.name || "Unknown SR",
        reference: `Issue`,
      })),
      ...payments.map((payment) => ({
        date: payment.paymentDate,
        type: "sold",
        quantity:
          payment.items.find(
            (item: any) => item.productId.toString() === productId,
          )?.quantity || 0,
        srName: (payment.srId as any)?.name || "Unknown SR",
        reference: `Payment`,
      })),
      ...customerReturns.map((return_) => ({
        date: return_.returnDate,
        type: "returned",
        quantity:
          return_.items.find(
            (item: any) => item.productId.toString() === productId,
          )?.quantity || 0,
        srName: (return_.srId as any)?.name || "Unknown SR",
        reference: `Customer Return`,
      })),
      ...damageReturns.map((return_) => ({
        date: return_.returnDate,
        type: "damaged",
        quantity:
          return_.items.find(
            (item: any) => item.productId.toString() === productId,
          )?.quantity || 0,
        srName: (return_.srId as any)?.name || "Unknown SR",
        reference: `Damage Return`,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        tradePrice: product.tradePrice,
      },
      history: allTransactions,
      summary: {
        totalIssued: issues.reduce(
          (sum, issue) =>
            sum +
            (issue.items.find(
              (item: any) => item.productId.toString() === productId,
            )?.quantity || 0),
          0,
        ),
        totalSold: payments.reduce(
          (sum, payment) =>
            sum +
            (payment.items.find(
              (item: any) => item.productId.toString() === productId,
            )?.quantity || 0),
          0,
        ),
        totalReturned: customerReturns.reduce(
          (sum, return_) =>
            sum +
            (return_.items.find(
              (item: any) => item.productId.toString() === productId,
            )?.quantity || 0),
          0,
        ),
        totalDamaged: damageReturns.reduce(
          (sum, return_) =>
            sum +
            (return_.items.find(
              (item: any) => item.productId.toString() === productId,
            )?.quantity || 0),
          0,
        ),
      },
    };
  }
}
