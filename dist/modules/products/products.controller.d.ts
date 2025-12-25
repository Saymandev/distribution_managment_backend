import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<import("../../database/schemas/product.schema").Product>;
    findAll(): Promise<any[]>;
    getUniqueUnits(): Promise<string[]>;
    getUniqueCategories(): Promise<string[]>;
    findOne(id: string): Promise<import("../../database/schemas/product.schema").Product>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<import("../../database/schemas/product.schema").Product>;
    updateStock(id: string, body: {
        quantity: number;
        operation?: 'add' | 'subtract';
    }): Promise<import("../../database/schemas/product.schema").Product>;
    remove(id: string): Promise<void>;
}
