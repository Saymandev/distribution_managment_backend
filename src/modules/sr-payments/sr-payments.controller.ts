import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSRPaymentDto } from './dto/create-sr-payment.dto';
import { UpdateSRPaymentDto } from './dto/update-sr-payment.dto';
import { SRPaymentsService } from './sr-payments.service';

@Controller('sr-payments')
@UseGuards(JwtAuthGuard)
export class SRPaymentsController {
  constructor(private readonly srPaymentsService: SRPaymentsService) {}

  @Post()
  create(@Body() createSRPaymentDto: CreateSRPaymentDto) {
    return this.srPaymentsService.create(createSRPaymentDto);
  }

  @Get()
  findAll(@Query('srId') srId?: string) {
    if (srId) {
      return this.srPaymentsService.findBySR(srId);
    }
    return this.srPaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.srPaymentsService.findOne(id);
  }

  @Get('issue/:issueId/due')
  getDueAmount(@Param('issueId') issueId: string) {
    return this.srPaymentsService.calculateDueAmount(issueId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSRPaymentDto: UpdateSRPaymentDto) {
    return this.srPaymentsService.update(id, updateSRPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.srPaymentsService.remove(id);
  }
}

