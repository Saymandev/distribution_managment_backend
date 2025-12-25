export declare class SRPaymentItemDto {
    productId: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
}
export declare class CreateSRPaymentDto {
    receiptNumber?: string;
    srId: string;
    issueId?: string;
    items: SRPaymentItemDto[];
    paymentMethod: string;
    notes?: string;
}
