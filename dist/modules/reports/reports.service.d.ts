import { Model, Types } from "mongoose";
import { CompanyClaimDocument } from "../../database/schemas/company-claim.schema";
import { CompanyDocument } from "../../database/schemas/company.schema";
import { ExpenseDocument } from "../../database/schemas/expense.schema";
import { ProductReturnDocument } from "../../database/schemas/product-return.schema";
import { ProductDocument } from "../../database/schemas/product.schema";
import { SalesRepDocument } from "../../database/schemas/salesrep.schema";
import { SRIssueDocument } from "../../database/schemas/sr-issue.schema";
import { SRPaymentDocument, SupplierPaymentDocument, SupplierReceiptDocument } from "../../database/schemas/sr-payment.schema";
export declare class ReportsService {
    private readonly srPaymentModel;
    private readonly companyClaimModel;
    private readonly expenseModel;
    private readonly srIssueModel;
    private readonly productModel;
    private readonly companyModel;
    private readonly salesRepModel;
    private readonly productReturnModel;
    private readonly supplierPaymentModel;
    private readonly supplierReceiptModel;
    constructor(srPaymentModel: Model<SRPaymentDocument>, companyClaimModel: Model<CompanyClaimDocument>, expenseModel: Model<ExpenseDocument>, srIssueModel: Model<SRIssueDocument>, productModel: Model<ProductDocument>, companyModel: Model<CompanyDocument>, salesRepModel: Model<SalesRepDocument>, productReturnModel: Model<ProductReturnDocument>, supplierPaymentModel: Model<SupplierPaymentDocument>, supplierReceiptModel: Model<SupplierReceiptDocument>);
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
        period: {
            startDate: Date;
            endDate: Date;
        };
        revenue: {
            totalSalesValue: any;
            cashReceived: any;
            outstandingReceivables: number;
            total: any;
        };
        cogs: {
            purchases: any;
            discountsReceived: any;
            netCOGS: number;
        };
        profitability: {
            grossProfit: number;
            operatingExpenses: any;
            netProfit: number;
        };
        inventory: {
            currentValue: any;
        };
        outstanding: {
            customerDues: number;
            supplierClaims: any;
        };
        byCompany: {
            companyId: any;
            companyName: string;
            netFromCompany: any;
            totalDealerPrice: any;
            totalCommission: any;
            totalSRPayment: any;
        }[];
    } | {
        companyId: string;
        period: {
            startDate: Date;
            endDate: Date;
        };
        revenue: {
            totalSalesValue: any;
            cashReceived: any;
            outstandingReceivables: number;
            total: any;
        };
        cogs: {
            purchases: any;
            discountsReceived: any;
            netCOGS: number;
        };
        profitability: {
            grossProfit: number;
            operatingExpenses: any;
            netProfit: number;
        };
        inventory: {
            currentValue: any;
        };
        outstanding: {
            customerDues: number;
            supplierClaims: any;
        };
        byCompany: {
            companyId: any;
            companyName: string;
            netFromCompany: any;
            totalDealerPrice: any;
            totalCommission: any;
            totalSRPayment: any;
        }[];
        details: any;
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
    getFloorStockReport(companyId?: string): Promise<{
        products: {
            productId: Types.ObjectId;
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
    getFinancialOverview(companyId?: string): Promise<{
        floorStock: {
            products: {
                productId: Types.ObjectId;
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
    getMonthlyReport(companyId?: string, startDate?: Date, endDate?: Date): Promise<{
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
    private getSalesForPeriod;
    private getExpensesForPeriod;
    private getSupplierPaymentsForPeriod;
    private getInventoryReceivedForPeriod;
    private getCustomerDuesForPeriod;
    getPendingCompanyClaims(companyId?: string): Promise<{
        companies: {
            companyId: string;
            companyName: string;
            totalClaims: number;
            pendingAmount: number;
            claimCount: number;
        }[];
        totalPendingClaims: number;
        totalClaimCount: number;
    }>;
    getDailyFinancialSummary(startDate?: Date, endDate?: Date, companyId?: string): Promise<{
        summary: any[];
        totalCollections: any;
        totalSupplierPayments: any;
        totalSupplierReceipts: any;
        totalProductIssued: any;
        totalIssues: any;
    }>;
    getPendingDeliveries(companyId?: string, page?: number, limit?: number, timePeriod?: "all" | "week" | "month" | "year"): Promise<{
        pendingDeliveries: any[];
        totalPendingItems: any;
        totalPendingValue: any;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    getProductHistory(productId: string, startDate?: Date, endDate?: Date): Promise<{
        history: any[];
        product: any;
        summary?: undefined;
    } | {
        product: {
            id: Types.ObjectId;
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
}
