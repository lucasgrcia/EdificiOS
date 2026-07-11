import { Controller, Get, Query } from '@nestjs/common';

import { DashboardView } from '../../application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../../application/get-operations-dashboard-use-case';

@Controller('api/v1/operations/dashboard')
export class DashboardController {
  constructor(
    private readonly getOperationsDashboardUseCase: GetOperationsDashboardUseCase,
  ) {}

  @Get()
  getDashboard(@Query('actorId') actorId?: string): Promise<DashboardView> {
    if (actorId === undefined) {
      return this.getOperationsDashboardUseCase.execute();
    }

    return this.getOperationsDashboardUseCase.execute({ actorId });
  }
}
