import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CustomersService } from './customers.service.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post('from-logo/:logoRef')
  importFromLogo(@Param('logoRef', ParseIntPipe) logoRef: number) {
    return this.customers.importFromLogo(logoRef);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customers.findOne(id);
  }
}
