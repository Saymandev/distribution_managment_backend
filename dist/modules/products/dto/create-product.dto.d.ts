export declare class CreateProductDto {
    name: string;
    sku: string;
    companyId: string;
    category?: string;
    unit: string;
    dealerPrice: number;
    commissionPercent: number;
    stock?: number;
    reorderLevel?: number;
    isActive?: boolean;
}
