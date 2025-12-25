import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Request() req, @Query('companyId') companyId?: string) {
    console.log('Dashboard request - user:', req.user);
    return this.reportsService.getDashboard(companyId);
  }

  @Get('profit-loss')
  getProfitLoss(
    @Query('companyId') companyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let start = startDate ? new Date(startDate) : undefined;
    let end = endDate ? new Date(endDate) : undefined;
    
    // If dates are provided, ensure they cover the full day
    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    
    return this.reportsService.getProfitLoss(companyId, start, end);
  }

  @Get('due-amounts')
  getDueAmounts(@Query('companyId') companyId?: string) {
    return this.reportsService.getDueAmounts(companyId);
  }

  @Get('weekly')
  getWeeklyData(@Query('companyId') companyId?: string) {
    return this.reportsService.getWeeklyData(companyId);
  }

  @Get('monthly')
  getMonthlyData(@Query('companyId') companyId?: string) {
    return this.reportsService.getMonthlyData(companyId);
  }

  @Get('stock')
  getStockReport() {
    return this.reportsService.getStockReport();
  }
}

