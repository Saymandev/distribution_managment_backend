import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ProductReturn,
  ProductReturnDocument,
  ReturnStatus,
  ReturnType,
} from "../../database/schemas/product-return.schema";
import {
  Product,
  ProductDocument,
} from "../../database/schemas/product.schema";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductReturn.name)
    private readonly productReturnModel: Model<ProductReturnDocument>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productModel.findOne({ sku: dto.sku }).exec();
    if (existing) {
      throw new ConflictException("Product with this SKU already exists");
    }
    // Always calculate tradePrice (TP)
    const commissionPercent = dto.commissionPercent ?? 0;
    const dealerPrice = dto.dealerPrice || 0; // Ensure dealerPrice is not undefined

    const tradePrice = Number(
      (dealerPrice + dealerPrice * (commissionPercent / 100)).toFixed(2),
    );
    const created = new this.productModel({
      ...dto,
      commissionPercent,
      tradePrice,
      stock: dto.stock ?? 0,
      reorderLevel: dto.reorderLevel ?? 0,
      isActive: dto.isActive ?? true,
    });

    return created.save();
  }

  async findAll(): Promise<any[]> {
    const products = await this.productModel
      .find()
      .populate("companyId", "name code")
      .sort({ stock: -1, name: 1 })
      .exec();

    // Calculate damaged quantity for each product from pending damage returns
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const productIds = products.map((p) => p._id);
    const damageReturns = await this.productReturnModel
      .find({
        returnType: ReturnType.DAMAGE_RETURN,
        status: { $in: [ReturnStatus.PENDING, ReturnStatus.PROCESSED] },
      })
      .exec();

    // Create a map of damaged quantities by product
    const damagedQuantities = new Map<string, number>();
    damageReturns.forEach((returnRecord) => {
      returnRecord.items.forEach((item) => {
        const productId =
          typeof item.productId === "string"
            ? item.productId
            : (item.productId as any)?._id?.toString();
        if (productId) {
          const current = damagedQuantities.get(productId) || 0;
          damagedQuantities.set(productId, current + item.quantity);
        }
      });
    });

    // Add damaged quantity to each product
    return products.map((product) => ({
      ...product.toObject(),
      damagedQuantity: damagedQuantities.get(product._id.toString()) || 0,
    }));
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate("companyId")
      .exec();
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.sku) {
      const existing = await this.productModel
        .findOne({ sku: dto.sku, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException("Product with this SKU already exists");
      }
    }
    // Always calculate tradePrice (TP) if dealerPrice or commissionPercent are present
    const updateBody: any = { ...dto };
    if (dto.dealerPrice !== undefined || dto.commissionPercent !== undefined) {
      // Fetch current values to calculate
      const prev = await this.productModel.findById(id);
      const commissionPercent =
        dto.commissionPercent !== undefined
          ? dto.commissionPercent
          : (prev?.commissionPercent ?? 0);
      const dealerPrice =
        dto.dealerPrice !== undefined
          ? dto.dealerPrice
          : (prev?.dealerPrice ?? 0);
      updateBody.tradePrice = Number(
        (dealerPrice + dealerPrice * (commissionPercent / 100)).toFixed(2),
      );
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: updateBody }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Product not found");
    }
    return updated;
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: "add" | "subtract" = "subtract",
  ): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    if (operation === "subtract" && product.stock < quantity) {
      throw new ConflictException("Insufficient stock");
    }
    const newStock =
      operation === "add" ? product.stock + quantity : product.stock - quantity;
    product.stock = Math.max(0, newStock);
    return product.save();
  }

  async remove(id: string): Promise<void> {
    const res = await this.productModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Product not found");
    }
  }

  async getUniqueUnits(): Promise<string[]> {
    const units = await this.productModel.distinct("unit").exec();
    return units.filter((u) => u && u.trim().length > 0).sort();
  }

  async getUniqueCategories(): Promise<string[]> {
    const categories = await this.productModel.distinct("category").exec();
    return categories.filter((c) => c && c.trim().length > 0).sort();
  }

  async searchProducts(
    companyId: string,
    query: string,
    limit: number,
  ): Promise<Product[]> {
    const searchFilter: any = { companyId };

    if (query) {
      searchFilter.$or = [
        { name: { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } },
      ];
    }

    const results = await this.productModel
      .find(searchFilter)
      .populate("companyId", "name code")
      .sort({ stock: -1, name: 1 })
      .limit(limit)
      .exec();

    return results; // Return the full Product objects directly
  }
}
