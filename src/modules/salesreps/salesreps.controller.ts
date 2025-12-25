import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SalesRepsService } from './salesreps.service';
import { CreateSalesRepDto } from './dto/create-salesrep.dto';
import { UpdateSalesRepDto } from './dto/update-salesrep.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('salesreps')
@UseGuards(JwtAuthGuard)
export class SalesRepsController {
  constructor(private readonly salesRepsService: SalesRepsService) {}

  @Post()
  create(@Body() createSalesRepDto: CreateSalesRepDto) {
    return this.salesRepsService.create(createSalesRepDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.salesRepsService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesRepsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalesRepDto: UpdateSalesRepDto) {
    return this.salesRepsService.update(id, updateSalesRepDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesRepsService.remove(id);
  }
}

