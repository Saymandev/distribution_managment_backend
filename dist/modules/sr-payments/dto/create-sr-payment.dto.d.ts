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
    receivedAmount?: number;
    companyClaim?: number;
    customerDue?: number;
    customerInfo?: {
        name?: string;
        address?: string;
        phone?: string;
    };
    notes?: string;
}
