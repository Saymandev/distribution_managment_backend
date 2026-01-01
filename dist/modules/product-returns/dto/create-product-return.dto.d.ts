import { ReturnType } from "../../../database/schemas/product-return.schema";
export declare class ReturnItemDto {
    productId: string;
    quantity: number;
    reason?: string;
}
export declare class CreateProductReturnDto {
    returnNumber: string;
    returnType: ReturnType;
    customerId?: string;
    srId?: string;
    companyId?: string;
    issueId?: string;
    items: ReturnItemDto[];
    notes?: string;
}
