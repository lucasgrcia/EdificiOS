import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { CreateWorkOrderFromIncidentUseCase } from '../../application/create-work-order-from-incident-use-case';
import { ListWorkOrdersByIncidentUseCase } from '../../application/list-work-orders-by-incident-use-case';
import { WorkOrderResult } from '../../application/work-order-result';
import { ActorNotFoundError } from '../../domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../../domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../../domain/work-order/open-work-order-already-exists';
import { CreateWorkOrderFromIncidentRequestDto } from './create-work-order-from-incident.dto';
import { CreateWorkOrderFromIncidentRequestPipe } from './create-work-order-from-incident-request.pipe';
import { ListWorkOrdersByIncidentParamsPipe } from './list-work-orders-by-incident-params.pipe';

@Controller('api/v1/operations/incidents')
export class IncidentWorkOrdersController {
  constructor(
    private readonly createWorkOrderFromIncidentUseCase: CreateWorkOrderFromIncidentUseCase,
    private readonly listWorkOrdersByIncidentUseCase: ListWorkOrdersByIncidentUseCase,
  ) {}

  @Post(':incidentId/work-orders')
  @HttpCode(HttpStatus.CREATED)
  async createFromIncident(
    @Param('incidentId', ListWorkOrdersByIncidentParamsPipe)
    incidentId: string,
    @Body(CreateWorkOrderFromIncidentRequestPipe)
    body: CreateWorkOrderFromIncidentRequestDto,
  ): Promise<WorkOrderResult> {
    try {
      return await this.createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: body.description,
      });
    } catch (error) {
      if (error instanceof IncidentNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ActorNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof OpenWorkOrderAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Get(':incidentId/work-orders')
  listByIncident(
    @Param('incidentId', ListWorkOrdersByIncidentParamsPipe)
    incidentId: string,
  ): Promise<WorkOrderResult[]> {
    return this.listWorkOrdersByIncidentUseCase.execute({ incidentId });
  }
}
