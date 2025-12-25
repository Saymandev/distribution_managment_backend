import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ProductReturnsService } from './product-returns.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { ReturnStatus } from '../../database/schemas/product-return.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-returns')
@UseGuards(JwtAuthGuard)
export class ProductReturnsController {
  constructor(private readonly productReturnsService: ProductReturnsService) {}

  @Post()
  create(@Body() createProductReturnDto: CreateProductReturnDto) {
    return this.productReturnsService.create(createProductReturnDto);
  }

  @Get()
  findAll() {
    return this.productReturnsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productReturnsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: ReturnStatus }) {
    return this.productReturnsService.updateStatus(id, body.status);
  }
}

