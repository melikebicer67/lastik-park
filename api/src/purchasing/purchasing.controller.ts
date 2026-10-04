import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { CreatePurchaseDto, DateRangeDto, PurchaseQueryDto, SupplierDto } from './purchasing.dto.js';
import { PurchasingService } from './purchasing.service.js';

@Controller()
export class PurchasingController {
  constructor(private readonly purchasing: PurchasingService) {}

  @Get('suppliers')
  suppliers() {
    return this.purchasing.suppliers();
  }

  @Post('suppliers')
  createSupplier(@Body() dto: SupplierDto) {
    return this.purchasing.createSupplier(dto);
  }

  @Put('suppliers/:id')
  updateSupplier(@Param('id', ParseIntPipe) id: number, @Body() dto: SupplierDto) {
    return this.purchasing.updateSupplier(id, dto);
  }

  @Get('purchases/report')
  report(@Query() q: DateRangeDto) {
    return this.purchasing.report(q);
  }

  @Get('purchases')
  list(@Query() q: PurchaseQueryDto) {
    return this.purchasing.list(q);
  }

  @Get('purchases/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasing.findOne(id);
  }

  @Post('purchases')
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasing.create(dto);
  }

  @Delete('purchases/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchasing.remove(id);
  }
}
