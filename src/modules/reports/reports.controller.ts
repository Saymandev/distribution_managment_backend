import {
    Controller,
    Get,
    Param,
    Query,
    Request,
    UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  getDashboard(@Request() req, @Query("companyId") companyId?: string) {
    console.log("Dashboard request - user:", req.user);
    return this.reportsService.getDashboard(companyId);
  }

  @Get("profit-loss")
  getProfitLoss(
    @Query("companyId") companyId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    // Parse dates properly to avoid timezone issues
    const start = startDate ? this.parseDateString(startDate, true) : undefined; // Start of day
    const end = endDate ? this.parseDateString(endDate, false) : undefined; // End of day

    return this.reportsService.getProfitLoss(companyId, start, end);
  }

  @Get("due-amounts")
  getDueAmounts(@Query("companyId") companyId?: string) {
    return this.reportsService.getDueAmounts(companyId);
  }

  @Get("weekly")
  getWeeklyData(@Query("companyId") companyId?: string) {
    return this.reportsService.getWeeklyData(companyId);
  }

  @Get("monthly")
  getMonthlyData(@Query("companyId") companyId?: string) {
    return this.reportsService.getMonthlyData(companyId);
  }

  @Get("floor-stock")
  getFloorStockReport(@Query("companyId") companyId?: string) {
    return this.reportsService.getFloorStockReport(companyId);
  }

  @Get("dues")
  getDuesReport(@Query("companyId") companyId?: string) {
    return this.reportsService.getDuesReport(companyId);
  }

  @Get("pending-deliveries")
  getPendingDeliveries(
    @Query("companyId") companyId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.reportsService.getPendingDeliveries(
      companyId,
      pageNum,
      limitNum,
    );
  }

  @Get("product-history/:productId")
  getProductHistory(
    @Param("productId") productId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getProductHistory(productId, start, end);
  }

  @Get("financial-overview")
  getFinancialOverview(@Query("companyId") companyId?: string) {
    return this.reportsService.getFinancialOverview(companyId);
  }

  @Get("monthly-report")
  getMonthlyReport(
    @Query("companyId") companyId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    console.log(
      `📊 Monthly report controller: companyId="${companyId}", startDate="${startDate}", endDate="${endDate}"`,
    );
    // Parse dates properly to avoid timezone issues
    const start = startDate ? this.parseDateString(startDate, true) : undefined; // Start of day
    const end = endDate ? this.parseDateString(endDate, false) : undefined; // End of day
    console.log(`📊 Calling service with companyId="${companyId}"`);
    return this.reportsService.getMonthlyReport(companyId, start, end);
  }

  private parseDateString(dateString: string, isStart: boolean): Date {
    // Parse YYYY-MM-DD format and set to start/end of day in local timezone
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // Month is 0-indexed

    if (isStart) {
      date.setHours(0, 0, 0, 0); // Start of day
    } else {
      date.setHours(23, 59, 59, 999); // End of day
    }

    return date;
  }

  @Get("daily-financial")
  getDailyFinancialSummary(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("companyId") companyId?: string,
  ) {
    // Parse dates properly to avoid timezone issues
    const start = startDate ? this.parseDateString(startDate, true) : undefined; // Start of day
    const end = endDate ? this.parseDateString(endDate, false) : undefined; // End of day
    return this.reportsService.getDailyFinancialSummary(start, end, companyId);
  }
}
