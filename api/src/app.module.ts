import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogoModule } from './logo/logo.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SettingsModule } from './settings/settings.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SettingsModule,
    LogoModule,
  ],
})
export class AppModule {}
