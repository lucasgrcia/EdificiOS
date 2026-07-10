import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { CaptureEvidenceUseCase } from '../src/operations/application/capture-evidence-use-case';
import { EvidenceView } from '../src/operations/application/evidence-view';
import { ListEvidenceByEventUseCase } from '../src/operations/application/list-evidence-by-event-use-case';
import { CaptureEvidenceMultipartPipe } from '../src/operations/infrastructure/http/capture-evidence-multipart.pipe';
import { EventsController } from '../src/operations/infrastructure/http/events.controller';
import { ListEvidenceByEventParamsPipe } from '../src/operations/infrastructure/http/list-evidence-by-event-params.pipe';

describe('List evidence by event HTTP integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const evidenceView: EvidenceView = {
    id: '00000000-0000-0000-0000-000000000001',
    storageReference: '2026/07/event-1/bomba.jpg',
    hashSha256: 'a'.repeat(64),
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    capturedAt: '2026-07-07T15:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let listEvidenceByEventUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    listEvidenceByEventUseCase = {
      execute: jest.fn().mockResolvedValue([evidenceView]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        CaptureEvidenceMultipartPipe,
        ListEvidenceByEventParamsPipe,
        {
          provide: CaptureEvidenceUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListEvidenceByEventUseCase,
          useValue: listEvidenceByEventUseCase,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/operations/events/:eventId/evidence', () => {
    it('returns 200 OK with evidence metadata', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/events/${eventId}/evidence`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([evidenceView]);
      expect(listEvidenceByEventUseCase.execute).toHaveBeenCalledWith({
        eventId,
      });
    });

    it('returns 200 OK with an empty list when event has no evidence', async () => {
      listEvidenceByEventUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/events/${eventId}/evidence`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it('does not expose file content in the response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/events/${eventId}/evidence`,
      });

      const body = response.json()[0];

      expect(body).not.toHaveProperty('content');
      expect(body).not.toHaveProperty('file');
      expect(body).toHaveProperty('storageReference');
      expect(body).toHaveProperty('hashSha256');
    });
  });
});
