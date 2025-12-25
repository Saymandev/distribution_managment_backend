export declare class SRIssueItemDto {
    productId: string;
    quantity: number;
    dealerPrice: number;
    tradePrice: number;
}
export declare class CreateSRIssueDto {
    issueNumber?: string;
    srId: string;
    items: SRIssueItemDto[];
    notes?: string;
}
