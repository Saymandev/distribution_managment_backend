export declare class ClaimItemDto {
    productId: string;
    quantity: number;
    dealerPrice: number;
    commissionRate: number;
    srPayment: number;
}
export declare class CreateCompanyClaimDto {
    claimNumber: string;
    companyId: string;
    paymentId?: string;
    items: ClaimItemDto[];
    status?: string;
    notes?: string;
}
