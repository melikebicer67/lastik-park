import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomersModule } from './customers/customers.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { LogoModule } from './logo/logo.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PurchasingModule } from './purchasing/purchasing.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TireSetsModule } from './tire-sets/tire-sets.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SettingsModule,
    LogoModule,
    CustomersModule,
    EmployeesModule,
    VehiclesModule,
    StorageModule,
    TireSetsModule,
    PurchasingModule,
  ],
})
export class AppModule {}
