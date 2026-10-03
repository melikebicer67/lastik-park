import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { StorageService } from './storage.service.js';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('warehouses')
  warehouses() {
    return this.storage.warehouses();
  }

  @Get('warehouses/:id/map')
  map(@Param('id', ParseIntPipe) id: number) {
    return this.storage.map(id);
  }

  @Get('warehouses/:id/locations')
  locations(@Param('id', ParseIntPipe) id: number, @Query('onlyAvailable') onlyAvailable?: string) {
    return this.storage.locations(id, onlyAvailable === 'true');
  }
}
