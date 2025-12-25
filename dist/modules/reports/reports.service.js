"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const expense_schema_1 = require("../../database/schemas/expense.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let ReportsService = class ReportsService {
    constructor(srPaymentModel, companyClaimModel, expenseModel, srIssueModel, productModel, companyModel, salesRepModel) {
        this.srPaymentModel = srPaymentModel;
        this.companyClaimModel = companyClaimModel;
        this.expenseModel = expenseModel;
        this.srIssueModel = srIssueModel;
        this.productModel = productModel;
        this.companyModel = companyModel;
        this.salesRepModel = salesRepModel;
    }
    async getDashboard(companyId) {
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
        const allPayments = await this.srPaymentModel.find().limit(5).select('paymentDate totalReceived').exec();
        const allClaims = await this.companyClaimModel.find().limit(5).select('createdAt paidDate status totalClaim netFromCompany companyId').exec();
        const allExpenses = await this.expenseModel.find().limit(5).select('date amount').exec();
        console.log('📊 Sample data check:', {
            payments: allPayments.map(p => ({ date: p.paymentDate, total: p.totalReceived })),
            claims: allClaims.map(c => {
                var _a;
                return ({
                    date: c.createdAt,
                    paidDate: c.paidDate,
                    paidDateISO: c.paidDate ? new Date(c.paidDate).toISOString() : null,
                    status: c.status,
                    totalClaim: c.totalClaim,
                    net: c.netFromCompany,
                    company: c.companyId,
                    companyStr: (_a = c.companyId) === null || _a === void 0 ? void 0 : _a.toString()
                });
            }),
            expenses: allExpenses.map(e => ({ date: e.date, amount: e.amount })),
        });
        const claimMatch = {};
        if (companyId) {
            claimMatch.companyId = companyId;
        }
        const paidClaimMatch = {
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
                        {
                            paidDate: {
                                $gte: today,
                                $lte: endOfToday
                            }
                        },
                        {
                            $and: [
                                { paidDate: { $exists: false } },
                                { createdAt: { $gte: today, $lte: endOfToday } }
                            ]
                        },
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
            paidClaimMatch.$and.push({ companyId: companyId });
        }
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
        const todayPaidClaims = await this.companyClaimModel.aggregate([
            { $match: paidClaimMatch },
            {
                $group: {
                    _id: null,
                    paidClaimAmount: { $sum: '$netFromCompany' },
                },
            },
        ]);
        console.log('🔍 Today Paid Claims Result:', todayPaidClaims);
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
    async getWeeklyData(companyId) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(startOfWeek);
            dayStart.setDate(startOfWeek.getDate() + i);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            const paymentMatch = {
                paymentDate: { $gte: dayStart, $lte: dayEnd },
            };
            const claimMatch = {
                createdAt: { $gte: dayStart, $lte: dayEnd },
            };
            const expenseMatch = {
                date: { $gte: dayStart, $lte: dayEnd },
            };
            if (companyId) {
                const baseMatch = { createdAt: { $gte: dayStart, $lte: dayEnd } };
                claimMatch.$or = [
                    Object.assign(Object.assign({}, baseMatch), { companyId: new mongoose_2.Types.ObjectId(companyId) }),
                    Object.assign(Object.assign({}, baseMatch), { companyId: companyId }),
                ];
            }
            let daySRPayments;
            if (companyId) {
                const companyIdObj = new mongoose_2.Types.ObjectId(companyId);
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
                    productIds: productIds.map(p => p.toString()).slice(0, 3),
                    dayStart: dayStart.toISOString(),
                    dayEnd: dayEnd.toISOString(),
                });
                const companyIssues = await this.srIssueModel
                    .find({
                    'items.productId': { $in: productIds },
                })
                    .select('_id')
                    .exec();
                const issueIds = companyIssues.map(issue => issue._id);
                console.log(`📊 Day ${i} (${days[i]}) - Issues found:`, {
                    issueCount: issueIds.length,
                    issueIds: issueIds.map(id => id.toString()).slice(0, 3),
                });
                if (issueIds.length === 0) {
                    daySRPayments = [];
                }
                else {
                    const issueIdStrings = issueIds.map(id => id.toString());
                    const issueIdObjectIds = issueIds.map(id => new mongoose_2.Types.ObjectId(id));
                    const paymentMatchWithIssue = Object.assign(Object.assign({}, paymentMatch), { $or: [
                            { issueId: { $in: issueIdStrings } },
                            { issueId: { $in: issueIdObjectIds } },
                        ] });
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
            }
            else {
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
            const dayClaims = await this.companyClaimModel.aggregate([
                { $match: claimMatch },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netFromCompany' },
                    },
                },
            ]);
            if (i === 3 && companyId) {
                console.log(`📊 Day ${i} (${days[i]}) - Claims query:`, {
                    claimMatch: JSON.stringify(claimMatch),
                    claimCount: dayClaims.length,
                    total: dayClaims.length > 0 ? dayClaims[0].total : 0,
                });
            }
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
    async getMonthlyData(companyId) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const weeks = [];
        let currentWeekStart = new Date(startOfMonth);
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
            const paymentMatch = {
                paymentDate: { $gte: weekStart, $lte: weekEnd },
            };
            const claimMatch = {
                createdAt: { $gte: weekStart, $lte: weekEnd },
            };
            const expenseMatch = {
                date: { $gte: weekStart, $lte: weekEnd },
            };
            if (companyId) {
                const baseMatch = { createdAt: { $gte: weekStart, $lte: weekEnd } };
                claimMatch.$or = [
                    Object.assign(Object.assign({}, baseMatch), { companyId: new mongoose_2.Types.ObjectId(companyId) }),
                    Object.assign(Object.assign({}, baseMatch), { companyId: companyId }),
                ];
            }
            let weekSRPayments;
            if (companyId) {
                const companyIdObj = new mongoose_2.Types.ObjectId(companyId);
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
                const companyIssues = await this.srIssueModel
                    .find({
                    'items.productId': { $in: productIds },
                })
                    .select('_id')
                    .exec();
                const issueIds = companyIssues.map(issue => issue._id);
                if (issueIds.length === 0) {
                    weekSRPayments = [];
                }
                else {
                    const issueIdStrings = issueIds.map(id => id.toString());
                    const issueIdObjectIds = issueIds.map(id => new mongoose_2.Types.ObjectId(id));
                    const paymentMatchWithIssue = Object.assign(Object.assign({}, paymentMatch), { $or: [
                            { issueId: { $in: issueIdStrings } },
                            { issueId: { $in: issueIdObjectIds } },
                        ] });
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
            }
            else {
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
            const weekClaims = await this.companyClaimModel.aggregate([
                { $match: claimMatch },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netFromCompany' },
                    },
                },
            ]);
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
    async getProfitLoss(companyId, startDate, endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        let finalStartDate = startDate || today;
        let finalEndDate = endDate || endOfToday;
        if (startDate) {
            finalStartDate = new Date(startDate);
            finalStartDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
            finalEndDate = new Date(endDate);
            finalEndDate.setHours(23, 59, 59, 999);
        }
        const matchConditions = {};
        if (companyId) {
            matchConditions.companyId = companyId;
        }
        matchConditions.createdAt = {
            $gte: finalStartDate,
            $lte: finalEndDate,
        };
        const srPaymentsMatch = {
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
        const expensesMatch = {
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
        }
        else {
            const totalNetFromCompany = companyClaims.reduce((sum, c) => sum + c.totalNetFromCompany, 0);
            const totalIncome = totalSRPayments + totalNetFromCompany;
            const netProfit = totalIncome - totalExpenses;
            const companyIds = companyClaims.map((c) => c._id).filter((id) => id);
            const companies = await this.companyModel
                .find({ _id: { $in: companyIds } })
                .select('_id name')
                .exec();
            const companyMap = new Map(companies.map((c) => [c._id.toString(), c.name]));
            return {
                income: {
                    srPayments: totalSRPayments,
                    netFromCompany: totalNetFromCompany,
                    total: totalIncome,
                },
                expenses: totalExpenses,
                netProfit,
                byCompany: companyClaims.map((c) => {
                    var _a;
                    return ({
                        companyId: c._id,
                        companyName: companyMap.get(((_a = c._id) === null || _a === void 0 ? void 0 : _a.toString()) || '') || 'Unknown Company',
                        netFromCompany: c.totalNetFromCompany,
                        totalDealerPrice: c.totalDealerPrice,
                        totalCommission: c.totalCommission,
                        totalSRPayment: c.totalSRPayment,
                    });
                }),
            };
        }
    }
    async getDueAmounts(companyId) {
        const srMatch = {};
        if (companyId) {
            srMatch.companyId = new mongoose_2.Types.ObjectId(companyId);
        }
        const salesReps = await this.salesRepModel.find(srMatch).select('_id name phone companyId').exec();
        const srIds = salesReps.map((sr) => sr._id);
        if (srIds.length === 0) {
            return { srDues: [] };
        }
        const issues = await this.srIssueModel
            .find({ srId: { $in: srIds } })
            .select('srId totalAmount')
            .exec();
        const issuesBySR = new Map();
        issues.forEach((issue) => {
            const srId = issue.srId.toString();
            const current = issuesBySR.get(srId) || 0;
            issuesBySR.set(srId, current + (issue.totalAmount || 0));
        });
        const payments = await this.srPaymentModel
            .find({ srId: { $in: srIds } })
            .select('srId totalReceived')
            .exec();
        const paymentsBySR = new Map();
        payments.forEach((payment) => {
            const srId = payment.srId.toString();
            const current = paymentsBySR.get(srId) || 0;
            paymentsBySR.set(srId, current + (payment.totalReceived || 0));
        });
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(2, (0, mongoose_1.InjectModel)(expense_schema_1.Expense.name)),
    __param(3, (0, mongoose_1.InjectModel)(sr_issue_schema_1.SRIssue.name)),
    __param(4, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(5, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(6, (0, mongoose_1.InjectModel)(salesrep_schema_1.SalesRep.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReportsService);
//# sourceMappingURL=reports.service.js.map