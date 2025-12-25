import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompanyClaim, CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { Company, CompanyDocument } from '../../database/schemas/company.schema';
import { Expense, ExpenseDocument } from '../../database/schemas/expense.schema';
import { Product, ProductDocument } from '../../database/schemas/product.schema';
import { SalesRep, SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssue, SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentDocument } from '../../database/schemas/sr-payment.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(SRPayment.name) private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(CompanyClaim.name) private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(SRIssue.name) private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(SalesRep.name) private readonly salesRepModel: Model<SalesRepDocument>,
  ) {}

  async getDashboard(companyId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    console.log('📊 Dashboard query:', { 
      companyId, 
      today: today.toISOString(), 
      endOfToday: endOfToday.toISOString(),
      todayLocal: today.toString(),
      endOfTodayLocal: endOfToday.toString()
    });

    // Debug: Check if there's any data at all
    const allPayments = await this.srPaymentModel.find().limit(5).select('paymentDate totalReceived').exec();
    const allClaims = await this.companyClaimModel.find().limit(5).select('createdAt paidDate status totalClaim netFromCompany companyId').exec();
    const allExpenses = await this.expenseModel.find().limit(5).select('date amount').exec();
    
    console.log('📊 Sample data check:', {
      payments: allPayments.map(p => ({ date: p.paymentDate, total: p.totalReceived })),
      claims: allClaims.map(c => ({ 
        date: (c as any).createdAt, 
        paidDate: (c as any).paidDate,
        paidDateISO: (c as any).paidDate ? new Date((c as any).paidDate).toISOString() : null,
        status: (c as any).status,
        totalClaim: (c as any).totalClaim,
        net: c.netFromCompany, 
        company: c.companyId,
        companyStr: c.companyId?.toString()
      })),
      expenses: allExpenses.map(e => ({ date: e.date, amount: e.amount })),
    });

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
          $or: [
            { status: 'paid' },
            { status: 'Paid' },
            { status: 'PAID' },
          ],
        },
        {
          $or: [
            // Match if paidDate is within today's range
            { 
              paidDate: { 
                $gte: today, 
                $lte: endOfToday 
              } 
            },
            // Or if paidDate doesn't exist but createdAt is today
            { 
              $and: [
                { paidDate: { $exists: false } },
                { createdAt: { $gte: today, $lte: endOfToday } }
              ]
            },
            // Or if paidDate exists but is null/undefined (handle edge cases)
            { 
              $and: [
                { paidDate: null },
                { createdAt: { $gte: today, $lte: endOfToday } }
              ]
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
          totalClaimAmount: { $sum: '$totalClaim' },
          pendingClaimAmount: {
            $sum: {
              $cond: [
                { 
                  $or: [
                    { $eq: ['$status', 'pending'] },
                    { $eq: ['$status', 'Pending'] },
                    { $eq: ['$status', 'PENDING'] },
                  ]
                }, 
                '$totalClaim', 
                0
              ],
            },
          },
          netClaimAmount: { $sum: '$netFromCompany' },
        },
      },
    ]);
    console.log('🔍 All Claims Stats Result:', allClaimsStats);

    // Get TODAY's Paid Claims (filtered by paidDate)
    // Paid Claim should show the net amount received from company, not total claim
    // Use paidClaimMatch directly - MongoDB will handle string to ObjectId conversion
    const todayPaidClaims = await this.companyClaimModel.aggregate([
      { $match: paidClaimMatch },
      {
        $group: {
          _id: null,
          paidClaimAmount: { $sum: '$netFromCompany' }, // Net amount received, not total claim
        },
      },
    ]);
    console.log('🔍 Today Paid Claims Result:', todayPaidClaims);

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
          total: { $sum: '$amount' },
        },
      },
    ]);

    const claimsStats = allClaimsStats.length > 0 ? allClaimsStats[0] : {
      totalClaimAmount: 0,
      pendingClaimAmount: 0,
      netClaimAmount: 0,
    };

    const paidClaimAmount = todayPaidClaims.length > 0 ? (todayPaidClaims[0].paidClaimAmount || 0) : 0;
    const expensesTotal = todayExpenses.length > 0 ? (todayExpenses[0].total || 0) : 0;
    
    // Net Profit = Paid Claim - Expense
    const netProfit = paidClaimAmount - expensesTotal;

    console.log('📊 Dashboard results:', {
      totalClaimAmount: claimsStats.totalClaimAmount,
      pendingClaimAmount: claimsStats.pendingClaimAmount,
      paidClaimAmount,
      netClaimAmount: claimsStats.netClaimAmount,
      expensesTotal,
      netProfit,
    });

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

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
            $or: [
              { companyId: companyIdObj },
              { companyId: companyId },
            ],
          })
          .select('_id')
          .exec();
        
        const productIds = companyProducts.map(p => p._id);
        
        console.log(`📊 Day ${i} (${days[i]}) - Company filtering:`, {
          companyId,
          companyIdObj: companyIdObj.toString(),
          productCount: productIds.length,
          productIds: productIds.map(p => p.toString()).slice(0, 3), // Show first 3
          dayStart: dayStart.toISOString(),
          dayEnd: dayEnd.toISOString(),
        });
        
        // Get issues that have these products
        const companyIssues = await this.srIssueModel
          .find({
            'items.productId': { $in: productIds },
          })
          .select('_id')
          .exec();
        
        const issueIds = companyIssues.map(issue => issue._id);
        
        console.log(`📊 Day ${i} (${days[i]}) - Issues found:`, {
          issueCount: issueIds.length,
          issueIds: issueIds.map(id => id.toString()).slice(0, 3), // Show first 3
        });
        
        if (issueIds.length === 0) {
          daySRPayments = [];
        } else {
          // Convert issueIds to strings for matching (MongoDB handles both)
          const issueIdStrings = issueIds.map(id => id.toString());
          const issueIdObjectIds = issueIds.map(id => new Types.ObjectId(id));
          
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
                total: { $sum: '$totalReceived' },
              },
            },
          ]);
          
          console.log(`📊 Day ${i} (${days[i]}) - Payment query result:`, {
            matchCount: daySRPayments.length,
            total: daySRPayments.length > 0 ? daySRPayments[0].total : 0,
          });
        }
      } else {
        daySRPayments = await this.srPaymentModel.aggregate([
          { $match: paymentMatch },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalReceived' },
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
            total: { $sum: '$netFromCompany' },
          },
        },
      ]);
      
      if (i === 3 && companyId) { // Log Wednesday (index 3) for debugging
        console.log(`📊 Day ${i} (${days[i]}) - Claims query:`, {
          claimMatch: JSON.stringify(claimMatch),
          claimCount: dayClaims.length,
          total: dayClaims.length > 0 ? dayClaims[0].total : 0,
        });
      }

      // Get Expenses for this day
      const dayExpenses = await this.expenseModel.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
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

    console.log('📊 WEEKLY DATA:', JSON.stringify(weeklyData, null, 2));
    return weeklyData;
  }

  async getMonthlyData(companyId?: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const weeks = [];
    let currentWeekStart = new Date(startOfMonth);
    
    // Get first Monday of the month or use the 1st
    const firstDay = startOfMonth.getDay();
    if (firstDay !== 1) {
      const daysToAdd = firstDay === 0 ? 1 : 8 - firstDay;
      currentWeekStart.setDate(startOfMonth.getDate() + daysToAdd);
    }

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (week * 7));
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
            $or: [
              { companyId: companyIdObj },
              { companyId: companyId },
            ],
          })
          .select('_id')
          .exec();
        
        const productIds = companyProducts.map(p => p._id);
        
        // Get issues that have these products
        const companyIssues = await this.srIssueModel
          .find({
            'items.productId': { $in: productIds },
          })
          .select('_id')
          .exec();
        
        const issueIds = companyIssues.map(issue => issue._id);
        
        if (issueIds.length === 0) {
          weekSRPayments = [];
        } else {
          // Convert issueIds to strings for matching (MongoDB handles both)
          const issueIdStrings = issueIds.map(id => id.toString());
          const issueIdObjectIds = issueIds.map(id => new Types.ObjectId(id));
          
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
                total: { $sum: '$totalReceived' },
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
              total: { $sum: '$totalReceived' },
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
            total: { $sum: '$netFromCompany' },
          },
        },
      ]);

      // Get Expenses for this week
      const weekExpenses = await this.expenseModel.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const revenue = (weekSRPayments.length > 0 ? weekSRPayments[0].total : 0) + 
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

    console.log('📊 MONTHLY DATA:', JSON.stringify(weeks, null, 2));
    return weeks;
  }

  async getProfitLoss(companyId?: string, startDate?: Date, endDate?: Date) {
    // If no dates provided, default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Ensure dates cover full day range
    let finalStartDate = startDate || today;
    let finalEndDate = endDate || endOfToday;
    
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

    // Always apply date filter (defaults to today if not provided)
    matchConditions.createdAt = {
      $gte: finalStartDate,
      $lte: finalEndDate,
    };

    // Get SR Payments - use same date range
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
          totalReceived: { $sum: '$totalReceived' },
        },
      },
    ]);

    // Get Company Claims (Net from company)
    const companyClaims = await this.companyClaimModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: companyId ? null : '$companyId',
          totalNetFromCompany: { $sum: '$netFromCompany' },
          totalDealerPrice: { $sum: '$totalDealerPrice' },
          totalCommission: { $sum: '$totalCommission' },
          totalSRPayment: { $sum: '$totalSRPayment' },
        },
      },
    ]);

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
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalSRPayments = srPayments.length > 0 ? srPayments[0].totalReceived : 0;
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

    if (companyId) {
      // Single company profit/loss
      const claim = companyClaims.length > 0 ? companyClaims[0] : null;
      const totalNetFromCompany = claim ? claim.totalNetFromCompany : 0;
      const totalIncome = totalSRPayments + totalNetFromCompany;
      const netProfit = totalIncome - totalExpenses;

      return {
        companyId,
        income: {
          srPayments: totalSRPayments,
          netFromCompany: totalNetFromCompany,
          total: totalIncome,
        },
        expenses: totalExpenses,
        netProfit,
        details: claim || {},
      };
    } else {
      // All companies profit/loss
      const totalNetFromCompany = companyClaims.reduce((sum, c) => sum + c.totalNetFromCompany, 0);
      const totalIncome = totalSRPayments + totalNetFromCompany;
      const netProfit = totalIncome - totalExpenses;

      // Get company names for the breakdown
      const companyIds = companyClaims.map((c) => c._id).filter((id) => id);
      const companies = await this.companyModel
        .find({ _id: { $in: companyIds } })
        .select('_id name')
        .exec();
      
      const companyMap = new Map(
        companies.map((c) => [c._id.toString(), c.name])
      );

      return {
        income: {
          srPayments: totalSRPayments,
          netFromCompany: totalNetFromCompany,
          total: totalIncome,
        },
        expenses: totalExpenses,
        netProfit,
        byCompany: companyClaims.map((c) => ({
          companyId: c._id,
          companyName: companyMap.get(c._id?.toString() || '') || 'Unknown Company',
          netFromCompany: c.totalNetFromCompany,
          totalDealerPrice: c.totalDealerPrice,
          totalCommission: c.totalCommission,
          totalSRPayment: c.totalSRPayment,
        })),
      };
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

    const salesReps = await this.salesRepModel.find(srMatch).select('_id name phone companyId').exec();
    const srIds = salesReps.map((sr) => sr._id);

    if (srIds.length === 0) {
      return { srDues: [] };
    }

    // Get all issues for these SRs
    const issues = await this.srIssueModel
      .find({ srId: { $in: srIds } })
      .select('srId totalAmount')
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
      .select('srId totalReceived')
      .exec();

    // Group payments by SR
    const paymentsBySR = new Map<string, number>();
    payments.forEach((payment) => {
      const srId = payment.srId.toString();
      const current = paymentsBySR.get(srId) || 0;
      paymentsBySR.set(srId, current + (payment.totalReceived || 0));
    });

    // Calculate dues
    const srDues = salesReps
      .map((sr) => {
        const srId = sr._id.toString();
        const totalIssued = issuesBySR.get(srId) || 0;
        const totalPaid = paymentsBySR.get(srId) || 0;
        const due = totalIssued - totalPaid;

        return {
          srId: srId,
          srName: (sr.name && sr.name.trim()) || 'Unknown Sales Rep',
          srPhone: (sr.phone && sr.phone.trim()) || undefined,
          totalIssued,
          totalPaid,
          due,
        };
      })
      .filter((d) => d.due > 0);

    return {
      srDues,
    };
  }

  async getStockReport() {
    const products = await this.productModel
      .find()
      .populate('companyId', 'name code')
      .select('name sku companyId stock reorderLevel unit')
      .sort({ stock: 1 })
      .exec();

    const lowStock = products.filter((p) => p.stock <= p.reorderLevel);
    const outOfStock = products.filter((p) => p.stock === 0);

    return {
      totalProducts: products.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      products: products.map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        company: p.companyId,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        unit: p.unit,
        status: p.stock === 0 ? 'out_of_stock' : p.stock <= p.reorderLevel ? 'low_stock' : 'in_stock',
      })),
    };
  }
}

