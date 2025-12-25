import { Model, Types } from 'mongoose';
import { CompanyClaimDocument } from '../../database/schemas/company-claim.schema';
import { CompanyDocument } from '../../database/schemas/company.schema';
import { ExpenseDocument } from '../../database/schemas/expense.schema';
import { ProductDocument } from '../../database/schemas/product.schema';
import { SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { SRPaymentDocument } from '../../database/schemas/sr-payment.schema';
export declare class ReportsService {
    private readonly srPaymentModel;
    private readonly companyClaimModel;
    private readonly expenseModel;
    private readonly srIssueModel;
    private readonly productModel;
    private readonly companyModel;
    private readonly salesRepModel;
    constructor(srPaymentModel: Model<SRPaymentDocument>, companyClaimModel: Model<CompanyClaimDocument>, expenseModel: Model<ExpenseDocument>, srIssueModel: Model<SRIssueDocument>, productModel: Model<ProductDocument>, companyModel: Model<CompanyDocument>, salesRepModel: Model<SalesRepDocument>);
    getDashboard(companyId?: string): Promise<{
        today: {
            totalClaimAmount: any;
            pendingClaimAmount: any;
            paidClaimAmount: any;
            netClaimAmount: any;
            expenses: any;
            netProfit: number;
        };
    }>;
    getWeeklyData(companyId?: string): Promise<any[]>;
    getMonthlyData(companyId?: string): Promise<any[]>;
    getProfitLoss(companyId?: string, startDate?: Date, endDate?: Date): Promise<{
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
    getStockReport(): Promise<{
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        products: {
            id: Types.ObjectId;
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
