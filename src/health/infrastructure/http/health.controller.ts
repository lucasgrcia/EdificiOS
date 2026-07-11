import { Controller, Get } from '@nestjs/common';

import { GetHealthUseCase } from '../../application/get-health-use-case';
import { HealthView } from '../../application/health-view';

@Controller('api/v1')
export class HealthController {
  constructor(private readonly getHealthUseCase: GetHealthUseCase) {}

  @Get('health')
  getHealth(): Promise<HealthView> {
    return this.getHealthUseCase.execute();
  }
}
