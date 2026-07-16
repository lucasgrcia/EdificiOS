import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/http/jwt-authentication.guard';
import { DashboardView } from '../../application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../../application/get-operations-dashboard-use-case';

@UseGuards(JwtAuthenticationGuard)
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
