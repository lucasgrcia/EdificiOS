import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import {
  CaptureEvidenceResult,
  CaptureEvidenceUseCase,
} from '../../application/capture-evidence-use-case';
import { CaptureEvidenceMultipartPipe } from './capture-evidence-multipart.pipe';

@Controller('api/v1/operations/events')
export class EventsController {
  constructor(
    private readonly captureEvidenceUseCase: CaptureEvidenceUseCase,
    private readonly captureEvidenceMultipartPipe: CaptureEvidenceMultipartPipe,
  ) {}

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
