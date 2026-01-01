import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClaimStatus } from "../../database/schemas/company-claim.schema";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CompanyClaimsService } from "./company-claims.service";
import { CreateCompanyClaimDto } from "./dto/create-company-claim.dto";

@Controller("company-claims")
@UseGuards(JwtAuthGuard)
export class CompanyClaimsController {
  constructor(private readonly companyClaimsService: CompanyClaimsService) {}

  @Post()
  create(@Body() createCompanyClaimDto: CreateCompanyClaimDto) {
    return this.companyClaimsService.create(createCompanyClaimDto);
  }

  @Get()
  findAll(@Query("companyId") companyId?: string) {
    if (companyId) {
      return this.companyClaimsService.findByCompany(companyId);
    }
    return this.companyClaimsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.companyClaimsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateData: any) {
    return this.companyClaimsService.update(id, updateData);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() body: { status: ClaimStatus; paidDate?: Date },
  ) {
    return this.companyClaimsService.updateStatus(
      id,
      body.status,
      body.paidDate,
    );
  }
}
