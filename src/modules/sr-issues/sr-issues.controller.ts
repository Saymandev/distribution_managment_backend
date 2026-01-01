import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SRIssuesService } from "./sr-issues.service";
import { CreateSRIssueDto } from "./dto/create-sr-issue.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("sr-issues")
@UseGuards(JwtAuthGuard)
export class SRIssuesController {
  constructor(private readonly srIssuesService: SRIssuesService) {}

  @Post()
  create(@Body() createSRIssueDto: CreateSRIssueDto) {
    return this.srIssuesService.create(createSRIssueDto);
  }

  @Get()
  findAll(@Query("srId") srId?: string) {
    if (srId) {
      return this.srIssuesService.findBySR(srId);
    }
    return this.srIssuesService.findAll();
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
