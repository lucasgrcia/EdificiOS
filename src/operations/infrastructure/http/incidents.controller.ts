import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { AssignIncidentUseCase } from '../../application/assign-incident-use-case';
import { DetectIncidentUseCase } from '../../application/detect-incident-use-case';
import { IncidentTransitionResult } from '../../application/incident-persistence';
import { ResolveIncidentUseCase } from '../../application/resolve-incident-use-case';
import { StartIncidentUseCase } from '../../application/start-incident-use-case';
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
  detect(
    @Body(DetectIncidentRequestPipe) body: DetectIncidentRequestDto,
  ): Promise<IncidentTransitionResult> {
    return this.detectIncidentUseCase.execute({
      description: body.description,
    });
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
