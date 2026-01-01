export declare class SupplierReceiptItemDto {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
    unit: string;
}
export declare class CreateSupplierReceiptDto {
    receiptNumber?: string;
    companyId: string;
    items: SupplierReceiptItemDto[];
    totalValue: number;
    receiptDate?: string;
    invoiceNumber?: string;
    notes?: string;
}
