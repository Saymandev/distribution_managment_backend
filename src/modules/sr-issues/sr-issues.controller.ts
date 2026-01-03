import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSRIssueDto } from "./dto/create-sr-issue.dto";
import { SRIssuesService } from "./sr-issues.service";

@Controller("sr-issues")
@UseGuards(JwtAuthGuard)
export class SRIssuesController {
  constructor(private readonly srIssuesService: SRIssuesService) {}

  @Post()
  create(@Body() createSRIssueDto: CreateSRIssueDto) {
    return this.srIssuesService.create(createSRIssueDto);
  }

  @Get()
  findAll(
    @Query("srId") srId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (srId) {
      return this.srIssuesService.findBySR(srId, pageNum, limitNum);
    }
    return this.srIssuesService.findAll(pageNum, limitNum);
  }

  @Get("optimized")
  getOptimized(@Query("companyId") companyId?: string) {
    return this.srIssuesService.getOptimized(companyId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.srIssuesService.findOne(id);
  }
}
