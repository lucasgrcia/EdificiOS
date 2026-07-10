import { Controller, Get } from '@nestjs/common';

import { DashboardView } from '../../application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../../application/get-operations-dashboard-use-case';

@Controller('api/v1/operations/dashboard')
export class DashboardController {
  constructor(
    private readonly getOperationsDashboardUseCase: GetOperationsDashboardUseCase,
  ) {}

  @Get()
  getDashboard(): Promise<DashboardView> {
    return this.getOperationsDashboardUseCase.execute();
  }
}
