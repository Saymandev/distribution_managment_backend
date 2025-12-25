import { ReportsService } from './reports.service';
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
    getStockReport(): Promise<{
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        products: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            sku: string;
            company: string;
            stock: number;
            reorderLevel: number;
            unit: string;
            status: string;
        }[];
    }>;
}
