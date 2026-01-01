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
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { UpdateSupplierPaymentDto } from "./dto/update-supplier-payment.dto";
import { SupplierPaymentsService } from "./supplier-payments.service";

@Controller("supplier-payments")
@UseGuards(JwtAuthGuard)
export class SupplierPaymentsController {
  constructor(
    private readonly supplierPaymentsService: SupplierPaymentsService,
  ) {}

  @Post()
  create(@Body() createSupplierPaymentDto: CreateSupplierPaymentDto) {
    return this.supplierPaymentsService.create(createSupplierPaymentDto);
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
    const filters = {
      companyId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    return this.supplierPaymentsService.findAllWithFilters(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.supplierPaymentsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateSupplierPaymentDto: UpdateSupplierPaymentDto,
  ) {
    return this.supplierPaymentsService.update(id, updateSupplierPaymentDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.supplierPaymentsService.remove(id);
  }
}
