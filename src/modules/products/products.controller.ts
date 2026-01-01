import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get("meta/units")
  getUniqueUnits() {
    return this.productsService.getUniqueUnits();
  }

  @Get("meta/categories")
  getUniqueCategories() {
    return this.productsService.getUniqueCategories();
  }

  @Get("search")
  search(
    @Query("companyId") companyId: string,
    @Query("query") query: string,
    @Query("limit") limit: string = "10",
  ) {
    return this.productsService.searchProducts(
      companyId,
      query,
      parseInt(limit),
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Put(":id/stock")
  updateStock(
    @Param("id") id: string,
    @Body() body: { quantity: number; operation?: "add" | "subtract" },
  ) {
    return this.productsService.updateStock(id, body.quantity, body.operation);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
