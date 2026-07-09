import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import {
  DetectIncidentResult,
  DetectIncidentUseCase,
} from '../../application/detect-incident-use-case';
import { DetectIncidentRequestDto } from './detect-incident.dto';
import { DetectIncidentRequestPipe } from './detect-incident-request.pipe';

@Controller('api/v1/operations/incidents')
export class IncidentsController {
  constructor(private readonly detectIncidentUseCase: DetectIncidentUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  detect(
    @Body(DetectIncidentRequestPipe) body: DetectIncidentRequestDto,
  ): Promise<DetectIncidentResult> {
    return this.detectIncidentUseCase.execute({
      description: body.description,
    });
  }
}
