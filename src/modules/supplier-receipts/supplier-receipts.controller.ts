import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSupplierReceiptDto } from "./dto/create-supplier-receipt.dto";
import { UpdateSupplierReceiptDto } from "./dto/update-supplier-receipt.dto";
import { SupplierReceiptsService } from "./supplier-receipts.service";

@Controller("supplier-receipts")
@UseGuards(JwtAuthGuard)
export class SupplierReceiptsController {
  constructor(
    private readonly supplierReceiptsService: SupplierReceiptsService,
  ) {}

  @Post()
  create(@Body() createSupplierReceiptDto: CreateSupplierReceiptDto) {
    return this.supplierReceiptsService.create(createSupplierReceiptDto);
  }

  @Get()
  findAll(
    @Query("companyId") companyId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    console.log("🎯 Controller: findAll called with params:", {
      companyId,
      page,
      limit,
      startDate,
      endDate,
      search,
    });
    const filters = {
      companyId,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };
    console.log("🎯 Controller: calling service with filters:", filters);
    const result = this.supplierReceiptsService.findAllWithFilters(filters);
    console.log("🎯 Controller: service returned:", result ? "result" : "null");
    return result;
  }

  @Get("balance")
  getSupplierBalance(@Query("companyId") companyId?: string) {
    return this.supplierReceiptsService.getSupplierBalance(companyId);
  }

  @Get("test-balance")
  testBalance(@Query("companyId") companyId?: string) {
    return this.supplierReceiptsService.testBalance(companyId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.supplierReceiptsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateSupplierReceiptDto: UpdateSupplierReceiptDto,
  ) {
    return this.supplierReceiptsService.update(id, updateSupplierReceiptDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.supplierReceiptsService.remove(id);
  }
}
