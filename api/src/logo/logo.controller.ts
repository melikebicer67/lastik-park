import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { LogoSettingsDto } from '../settings/logo-settings.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import { LogoConnectionService } from './logo-connection.service.js';
import { CustomerQueryDto } from './logo.dto.js';
import { LogoRepository } from './logo.repository.js';

@Controller('logo')
export class LogoController {
  constructor(
    private readonly repo: LogoRepository,
    private readonly connection: LogoConnectionService,
    private readonly settings: SettingsService,
  ) {}

  // Formdaki bilgilerle (kaydetmeden) bağlantıyı dener
  @Post('connection/test')
  async test(@Body() dto: LogoSettingsDto) {
    return this.connection.test(await this.settings.resolveLogoConfig(dto));
  }

  // Şu an kullanılan bağlantıyı dener
  @Get('connection/test')
  async testCurrent() {
    const { source: _source, ...config } = await this.settings.getLogoConfig();
    return this.connection.test(config);
  }

  @Get('customers')
  customers(@Query() query: CustomerQueryDto) {
    return this.repo.findCustomers(query);
  }

  @Get('customers/:ref')
  customer(@Param('ref', ParseIntPipe) ref: number) {
    return this.repo.findCustomer(ref);
  }

  @Get('salesmen')
  salesmen() {
    return this.repo.findSalesmen();
  }

  @Get('personnel')
  personnel() {
    return this.repo.findPersonnel();
  }
}
