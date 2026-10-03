import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CheckInDto, CheckOutDto, TireSetQueryDto } from './tire-sets.dto.js';
import { TireSetsService } from './tire-sets.service.js';

@Controller('tire-sets')
export class TireSetsController {
  constructor(private readonly tireSets: TireSetsService) {}

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto) {
    return this.tireSets.checkIn(dto);
  }

  @Post(':id/check-out')
  checkOut(@Param('id', ParseIntPipe) id: number, @Body() dto: CheckOutDto) {
    return this.tireSets.checkOut(id, dto);
  }

  @Get()
  list(@Query() query: TireSetQueryDto) {
    return this.tireSets.list(query);
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.tireSets.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tireSets.findOne(id);
  }
}
