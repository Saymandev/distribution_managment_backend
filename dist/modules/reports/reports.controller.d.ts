import { ReportsService } from "./reports.service";
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboard(req: any, companyId?: string): Promise<{
        today: {
            totalClaimAmount: any;
            pendingClaimAmount: any;
            paidClaimAmount: any;
            netClaimAmount: any;
            expenses: any;
            netProfit: number;
        };
    }>;
    getProfitLoss(companyId?: string, startDate?: string, endDate?: string): Promise<{
        companyId: string;
        income: {
            srPayments: any;
            netFromCompany: any;
            total: any;
        };
        expenses: any;
        netProfit: number;
        details: any;
        byCompany?: undefined;
    } | {
        income: {
            srPayments: any;
            netFromCompany: any;
            total: any;
        };
        expenses: any;
        netProfit: number;
        byCompany: {
            companyId: any;
            companyName: string;
            netFromCompany: any;
            totalDealerPrice: any;
            totalCommission: any;
            totalSRPayment: any;
        }[];
        companyId?: undefined;
        details?: undefined;
    }>;
    getDueAmounts(companyId?: string): Promise<{
        srDues: {
            srId: string;
            srName: string;
            srPhone: string;
            totalIssued: number;
            totalPaid: number;
            due: number;
        }[];
    }>;
    getWeeklyData(companyId?: string): Promise<any[]>;
    getMonthlyData(companyId?: string): Promise<any[]>;
    getFloorStockReport(companyId?: string): Promise<{
        products: {
            productId: import("mongoose").Types.ObjectId;
            productName: string;
            sku: string;
            company: string;
            stock: number;
            unit: string;
            dealerPrice: number;
            tradePrice: number;
            floorStockValue: number;
        }[];
        summary: {
            company: any;
            totalStock: number;
            totalValue: number;
        }[];
        totalProducts: number;
        totalStock: number;
        totalValue: number;
    }>;
    getDuesReport(companyId?: string): Promise<{
        customers: {
            customerName: string;
            customerPhone?: string;
            customerAddress?: string;
            totalCustomerDue: number;
            totalCompanyClaim: number;
            totalReceived: number;
            paymentCount: number;
            payments: any[];
        }[];
        totalCustomerDue: number;
        totalCompanyClaim: number;
        totalReceived: number;
    }>;
    getPendingDeliveries(companyId?: string, page?: string, limit?: string): Promise<{
        pendingDeliveries: unknown[];
        totalPendingItems: any;
        totalPendingValue: any;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    getProductHistory(productId: string, startDate?: string, endDate?: string): Promise<{
        history: any[];
        product: any;
        summary?: undefined;
    } | {
        product: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            sku: string;
            unit: string;
            tradePrice: number;
        };
        history: {
            date: Date;
            type: string;
            quantity: number;
            srName: any;
            reference: string;
        }[];
        summary: {
            totalIssued: number;
            totalSold: number;
            totalReturned: number;
            totalDamaged: number;
        };
    }>;
    getFinancialOverview(companyId?: string): Promise<{
        floorStock: {
            products: {
                productId: import("mongoose").Types.ObjectId;
                productName: string;
                sku: string;
                company: string;
                stock: number;
                unit: string;
                dealerPrice: number;
                tradePrice: number;
                floorStockValue: number;
            }[];
            summary: {
                company: any;
                totalStock: number;
                totalValue: number;
            }[];
            totalProducts: number;
            totalStock: number;
            totalValue: number;
        } | {
            products: {
                productId: string;
                productName: string;
                sku: string;
                company: {
                    name: string;
                };
                stock: number;
                unit: string;
                tradePrice: number;
                floorStockValue: number;
            }[];
            summary: {
                company: {
                    name: string;
                };
                totalStock: number;
                totalValue: number;
            }[];
            totalProducts: number;
            totalStock: number;
            totalValue: number;
        };
        customerDues: {
            srDues: {
                srId: string;
                srName: string;
                srPhone: string;
                totalIssued: number;
                totalPaid: number;
                due: number;
            }[];
        };
        companyClaims: {
            companies: {
                companyId: string;
                companyName: string;
                totalClaims: number;
                pendingAmount: number;
                claimCount: number;
            }[];
            totalPendingClaims: number;
            totalClaimCount: number;
        };
    }>;
    getMonthlyReport(companyId?: string, startDate?: string, endDate?: string): Promise<{
        currentMonth: any;
        previousMonth: any;
        growth: {
            salesGrowth: number;
            expenseGrowth: number;
            profitGrowth: number;
        };
        monthlyData: any[];
        totalPendingClaims: number;
    }>;
    private parseDateString;
    getDailyFinancialSummary(startDate?: string, endDate?: string, companyId?: string): Promise<{
        summary: any[];
        totalCollections: any;
        totalSupplierPayments: any;
        totalSupplierReceipts: any;
        totalProductIssued: any;
        totalIssues: any;
    }>;
}
