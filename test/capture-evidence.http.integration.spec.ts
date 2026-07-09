import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import FormData = require('form-data');

import { CaptureEvidenceUseCase } from '../src/operations/application/capture-evidence-use-case';
import { CaptureEvidenceMultipartPipe } from '../src/operations/infrastructure/http/capture-evidence-multipart.pipe';
import { EventsController } from '../src/operations/infrastructure/http/events.controller';

describe('Capture evidence HTTP integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const evidenceId = '00000000-0000-0000-0000-000000000001';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const fixturePath = join(__dirname, 'fixtures', 'bomba-principal.jpg');

  let app: NestFastifyApplication;
  let captureEvidenceUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    captureEvidenceUseCase = {
      execute: jest.fn().mockResolvedValue({ evidenceId }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        CaptureEvidenceMultipartPipe,
        {
          provide: CaptureEvidenceUseCase,
          useValue: captureEvidenceUseCase,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.register(multipart);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function buildMultipartPayload(options?: {
    includeFile?: boolean;
    actorId?: string;
    caption?: string;
    filename?: string;
    contentType?: string;
    filePath?: string;
  }) {
    const form = new FormData();

    if (options?.actorId !== undefined) {
      form.append('actorId', options.actorId);
    }

    if (options?.caption !== undefined) {
      form.append('caption', options.caption);
    }

    if (options?.includeFile !== false) {
      form.append('file', readFileSync(options?.filePath ?? fixturePath), {
        filename: options?.filename ?? 'bomba-principal.jpg',
        contentType: options?.contentType ?? 'image/jpeg',
      });
    }

    return form;
  }

  it('returns 201 Created with evidenceId for a real multipart upload', async () => {
    const form = buildMultipartPayload({
      actorId,
      caption: 'Olor a quemado en bomba principal.',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/operations/events/${eventId}/evidence`,
      headers: form.getHeaders(),
      payload: form,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ evidenceId });
  });

  it('adapts multipart request to CaptureEvidenceUseCase command', async () => {
    const form = buildMultipartPayload({
      actorId,
      caption: 'Olor a quemado en bomba principal.',
    });

    await app.inject({
      method: 'POST',
      url: `/api/v1/operations/events/${eventId}/evidence`,
      headers: form.getHeaders(),
      payload: form,
    });

    expect(captureEvidenceUseCase.execute).toHaveBeenCalledTimes(1);
    expect(captureEvidenceUseCase.execute).toHaveBeenCalledWith({
      eventId,
      actorId,
      content: expect.any(Buffer),
      mimeType: 'image/jpeg',
      storageReference: expect.stringMatching(
        /^\d{4}\/\d{2}\/[0-9a-f-]+-bomba-principal\.jpg$/,
      ),
      caption: 'Olor a quemado en bomba principal.',
    });
    expect(
      captureEvidenceUseCase.execute.mock.calls[0][0].content.byteLength,
    ).toBeGreaterThan(0);
  });

  it('returns 400 when actorId is missing', async () => {
    const form = buildMultipartPayload({ includeFile: true });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/operations/events/${eventId}/evidence`,
      headers: form.getHeaders(),
      payload: form,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Actor id is required.');
    expect(captureEvidenceUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns 400 when file is missing', async () => {
    const form = buildMultipartPayload({
      actorId,
      includeFile: false,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/operations/events/${eventId}/evidence`,
      headers: form.getHeaders(),
      payload: form,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Evidence file is required.');
    expect(captureEvidenceUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns 400 when mime type is not supported', async () => {
    const form = buildMultipartPayload({
      actorId,
      contentType: 'application/pdf',
      filename: 'documento.pdf',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/operations/events/${eventId}/evidence`,
      headers: form.getHeaders(),
      payload: form,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Mime type is not supported.');
    expect(captureEvidenceUseCase.execute).not.toHaveBeenCalled();
  });
});
