import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { ApplicationConfigModule } from './config/application-config.module';
import { HealthModule } from './health/health.module';
import { InfoModule } from './info/info.module';
import { OperationsModule } from './operations/operations.module';
import { CorrelationIdMiddleware } from './shared/http/correlation-id.middleware';
import { HttpValidationPipe } from './shared/http/http-validation.pipe';
import { ProblemDetailsFilter } from './shared/http/problem-details.filter';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ApplicationConfigModule,
    SharedModule,
    OperationsModule,
    HealthModule,
    InfoModule,
  ],
  providers: [
    CorrelationIdMiddleware,
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
