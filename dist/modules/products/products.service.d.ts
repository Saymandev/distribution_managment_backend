import { Model } from "mongoose";
import { ProductReturnDocument } from "../../database/schemas/product-return.schema";
import { Product, ProductDocument } from "../../database/schemas/product.schema";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
export declare class ProductsService {
    private readonly productModel;
    private readonly productReturnModel;
    constructor(productModel: Model<ProductDocument>, productReturnModel: Model<ProductReturnDocument>);
    create(dto: CreateProductDto): Promise<Product>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto): Promise<Product>;
    updateStock(id: string, quantity: number, operation?: "add" | "subtract"): Promise<Product>;
    remove(id: string): Promise<void>;
    getUniqueUnits(): Promise<string[]>;
    getUniqueCategories(): Promise<string[]>;
    search(companyId: string, query: string, limit: number): Promise<Product[]>;
}
