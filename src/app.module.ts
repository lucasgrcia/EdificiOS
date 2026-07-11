import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { InfoModule } from './info/info.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [OperationsModule, HealthModule, InfoModule],
})
export class AppModule {}
