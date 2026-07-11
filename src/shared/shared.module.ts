import { Global, Module } from '@nestjs/common';

import { CorrelationIdProvider } from './correlation-id';
import { ApplicationLogger } from './logging/application-logger';
import { ApplicationMetrics } from './metrics/application-metrics';

@Global()
@Module({
  providers: [
    CorrelationIdProvider,
    ApplicationMetrics,
    {
      provide: ApplicationLogger,
      inject: [CorrelationIdProvider],
      useFactory: (correlationIdProvider: CorrelationIdProvider) =>
        new ApplicationLogger({
          correlationIdProvider,
          clock: {
            now: () => new Date(),
          },
        }),
    },
  ],
  exports: [CorrelationIdProvider, ApplicationLogger, ApplicationMetrics],
})
export class SharedModule {}
