import { Module } from '@nestjs/common';

import { GetApiInfoUseCase } from './application/get-api-info-use-case';
import { InfoController } from './infrastructure/http/info.controller';

@Module({
  controllers: [InfoController],
  providers: [GetApiInfoUseCase],
})
export class InfoModule {}
