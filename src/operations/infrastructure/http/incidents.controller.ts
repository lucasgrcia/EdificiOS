import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { AssignIncidentUseCase } from '../../application/assign-incident-use-case';
import { DetectIncidentUseCase } from '../../application/detect-incident-use-case';
import { IncidentTransitionResult } from '../../application/incident-persistence';
import { ResolveIncidentUseCase } from '../../application/resolve-incident-use-case';
import { StartIncidentUseCase } from '../../application/start-incident-use-case';
import { AssetNotFoundError } from '../../domain/asset/asset-not-found';
import { MultipleActiveShiftsError } from '../../domain/shift/multiple-active-shifts';
import { NoActiveShiftError } from '../../domain/shift/no-active-shift';
import { AssignIncidentRequestDto } from './assign-incident.dto';
import { AssignIncidentRequestPipe } from './assign-incident-request.pipe';
import { DetectIncidentRequestDto } from './detect-incident.dto';
import { DetectIncidentRequestPipe } from './detect-incident-request.pipe';

@Controller('api/v1/operations/incidents')
export class IncidentsController {
  constructor(
    private readonly detectIncidentUseCase: DetectIncidentUseCase,
    private readonly assignIncidentUseCase: AssignIncidentUseCase,
    private readonly startIncidentUseCase: StartIncidentUseCase,
    private readonly resolveIncidentUseCase: ResolveIncidentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async detect(
    @Body(DetectIncidentRequestPipe) body: DetectIncidentRequestDto,
  ): Promise<IncidentTransitionResult> {
    try {
      return await this.detectIncidentUseCase.execute({
        assetId: body.assetId,
        description: body.description,
      });
    } catch (error) {
      if (error instanceof AssetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NoActiveShiftError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof MultipleActiveShiftsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.CREATED)
  assign(
    @Param('id') incidentId: string,
    @Body(AssignIncidentRequestPipe) body: AssignIncidentRequestDto,
  ): Promise<IncidentTransitionResult> {
    return this.assignIncidentUseCase.execute({
      incidentId,
      actorId: body.actorId,
    });
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  start(@Param('id') incidentId: string): Promise<IncidentTransitionResult> {
    return this.startIncidentUseCase.execute({ incidentId });
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.CREATED)
  resolve(@Param('id') incidentId: string): Promise<IncidentTransitionResult> {
    return this.resolveIncidentUseCase.execute({ incidentId });
  }
}
