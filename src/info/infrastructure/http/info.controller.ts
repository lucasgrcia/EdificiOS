import { Controller, Get } from '@nestjs/common';

import { ApiInfoView } from '../../application/api-info-view';
import { GetApiInfoUseCase } from '../../application/get-api-info-use-case';

@Controller('api/v1')
export class InfoController {
  constructor(private readonly getApiInfoUseCase: GetApiInfoUseCase) {}

  @Get('info')
  getInfo(): ApiInfoView {
    return this.getApiInfoUseCase.execute();
  }
}
