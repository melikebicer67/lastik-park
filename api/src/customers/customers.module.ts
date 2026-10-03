import { Module } from '@nestjs/common';
import { LogoModule } from '../logo/logo.module.js';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [LogoModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
