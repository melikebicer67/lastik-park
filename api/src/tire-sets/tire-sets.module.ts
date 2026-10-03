import { Module } from '@nestjs/common';
import { TireSetsController } from './tire-sets.controller.js';
import { TireSetsService } from './tire-sets.service.js';

@Module({
  controllers: [TireSetsController],
  providers: [TireSetsService],
})
export class TireSetsModule {}
