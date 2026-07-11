import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { InfoModule } from './info/info.module';
import { OperationsModule } from './operations/operations.module';
import { CorrelationIdMiddleware } from './shared/http/correlation-id.middleware';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [SharedModule, OperationsModule, HealthModule, InfoModule],
  providers: [CorrelationIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
