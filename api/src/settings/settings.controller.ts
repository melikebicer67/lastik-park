import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { LogoSettingsDto } from './logo-settings.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('logo')
  getLogo() {
    return this.settings.getLogoSettingsPublic();
  }

  @Put('logo')
  saveLogo(@Body() dto: LogoSettingsDto) {
    return this.settings.saveLogoSettings(dto);
  }

  @Delete('logo')
  resetLogo() {
    return this.settings.resetLogoSettings();
  }
}
