import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { LogoConnectionService } from './logo-connection.service.js';
import { LogoController } from './logo.controller.js';
import { LogoRepository } from './logo.repository.js';

@Module({
  imports: [SettingsModule],
  controllers: [LogoController],
  providers: [LogoConnectionService, LogoRepository],
  exports: [LogoRepository],
})
export class LogoModule {}
