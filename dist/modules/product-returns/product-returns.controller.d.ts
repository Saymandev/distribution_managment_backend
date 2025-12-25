import { ProductReturnsService } from './product-returns.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { ReturnStatus } from '../../database/schemas/product-return.schema';
export declare class ProductReturnsController {
    private readonly productReturnsService;
    constructor(productReturnsService: ProductReturnsService);
    create(createProductReturnDto: CreateProductReturnDto): Promise<import("../../database/schemas/product-return.schema").ProductReturn>;
    findAll(): Promise<import("../../database/schemas/product-return.schema").ProductReturn[]>;
    findOne(id: string): Promise<import("../../database/schemas/product-return.schema").ProductReturn>;
    updateStatus(id: string, body: {
        status: ReturnStatus;
    }): Promise<import("../../database/schemas/product-return.schema").ProductReturn>;
}
