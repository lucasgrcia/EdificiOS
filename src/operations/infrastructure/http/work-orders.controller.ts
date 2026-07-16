import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/http/jwt-authentication.guard';
import { CancelWorkOrderUseCase } from '../../application/cancel-work-order-use-case';
import { CompleteWorkOrderUseCase } from '../../application/complete-work-order-use-case';
import { CreateWorkOrderUseCase } from '../../application/create-work-order-use-case';
import { GetWorkOrderByIdUseCase } from '../../application/get-work-order-by-id-use-case';
import { StartWorkOrderUseCase } from '../../application/start-work-order-use-case';
import { WorkOrderResult } from '../../application/work-order-result';
import { ActorNotFoundError } from '../../domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../../domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../../domain/work-order/open-work-order-already-exists';
import { WorkOrderNotFoundError } from '../../domain/work-order/work-order-not-found';
import { CreateWorkOrderRequestDto } from './create-work-order.dto';
import { CreateWorkOrderRequestPipe } from './create-work-order-request.pipe';
import { GetWorkOrderByIdParamsPipe } from './get-work-order-by-id-params.pipe';

@UseGuards(JwtAuthenticationGuard)
@Controller('api/v1/operations/work-orders')
export class WorkOrdersController {
  constructor(
    private readonly createWorkOrderUseCase: CreateWorkOrderUseCase,
    private readonly getWorkOrderByIdUseCase: GetWorkOrderByIdUseCase,
    private readonly startWorkOrderUseCase: StartWorkOrderUseCase,
    private readonly completeWorkOrderUseCase: CompleteWorkOrderUseCase,
    private readonly cancelWorkOrderUseCase: CancelWorkOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(CreateWorkOrderRequestPipe) body: CreateWorkOrderRequestDto,
  ): Promise<WorkOrderResult> {
    try {
      return await this.createWorkOrderUseCase.execute({
        incidentId: body.incidentId,
        actorId: body.actorId,
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

  @Get(':id')
  getById(
    @Param('id', GetWorkOrderByIdParamsPipe) workOrderId: string,
  ): Promise<WorkOrderResult> {
    return this.getWorkOrderByIdUseCase
      .execute({ workOrderId })
      .then((workOrder) => {
        if (workOrder === null) {
          throw new NotFoundException('Work order was not found.');
        }

        return workOrder;
      });
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async start(
    @Param('id', GetWorkOrderByIdParamsPipe) workOrderId: string,
  ): Promise<WorkOrderResult> {
    try {
      return await this.startWorkOrderUseCase.execute({ workOrderId });
    } catch (error) {
      this.mapTransitionError(error);
    }
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id', GetWorkOrderByIdParamsPipe) workOrderId: string,
  ): Promise<WorkOrderResult> {
    try {
      return await this.completeWorkOrderUseCase.execute({ workOrderId });
    } catch (error) {
      this.mapTransitionError(error);
    }
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', GetWorkOrderByIdParamsPipe) workOrderId: string,
  ): Promise<WorkOrderResult> {
    try {
      return await this.cancelWorkOrderUseCase.execute({ workOrderId });
    } catch (error) {
      this.mapTransitionError(error);
    }
  }

  private mapTransitionError(error: unknown): never {
    if (error instanceof WorkOrderNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }

    throw error;
  }
}
