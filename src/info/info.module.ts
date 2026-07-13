import { Module } from '@nestjs/common';

import { ApplicationConfig } from '../config/application-config';
import { ApplicationConfigModule } from '../config/application-config.module';
import { GetApiInfoUseCase } from './application/get-api-info-use-case';
import { InfoController } from './infrastructure/http/info.controller';

@Module({
  imports: [ApplicationConfigModule],
  controllers: [InfoController],
  providers: [
    {
      provide: GetApiInfoUseCase,
      inject: [ApplicationConfig],
      useFactory: (applicationConfig: ApplicationConfig) =>
        new GetApiInfoUseCase(applicationConfig),
    },
  ],
})
export class InfoModule {}
