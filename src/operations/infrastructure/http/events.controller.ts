import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/http/jwt-authentication.guard';
import {
  CaptureEvidenceResult,
  CaptureEvidenceUseCase,
} from '../../application/capture-evidence-use-case';
import { EvidenceView } from '../../application/evidence-view';
import { ListEvidenceByEventUseCase } from '../../application/list-evidence-by-event-use-case';
import { CaptureEvidenceMultipartPipe } from './capture-evidence-multipart.pipe';
import { ListEvidenceByEventParamsPipe } from './list-evidence-by-event-params.pipe';

@UseGuards(JwtAuthenticationGuard)
@Controller('api/v1/operations/events')
export class EventsController {
  constructor(
    private readonly captureEvidenceUseCase: CaptureEvidenceUseCase,
    private readonly captureEvidenceMultipartPipe: CaptureEvidenceMultipartPipe,
    private readonly listEvidenceByEventUseCase: ListEvidenceByEventUseCase,
  ) {}

  @Get(':eventId/evidence')
  listByEvent(
    @Param('eventId', ListEvidenceByEventParamsPipe) eventId: string,
  ): Promise<EvidenceView[]> {
    return this.listEvidenceByEventUseCase.execute({ eventId });
  }

  @Post(':eventId/evidence')
  @HttpCode(HttpStatus.CREATED)
  async capture(
    @Param('eventId') eventId: string,
    @Req() request: FastifyRequest,
  ): Promise<CaptureEvidenceResult> {
    const body = await this.captureEvidenceMultipartPipe.transform(request);

    return this.captureEvidenceUseCase.execute({
      eventId,
      actorId: body.actorId,
      content: body.content,
      mimeType: body.mimeType,
      storageReference: body.storageReference,
      caption: body.caption,
    });
  }
}
