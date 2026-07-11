import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { GetApiInfoUseCase } from '../src/info/application/get-api-info-use-case';
import { InfoController } from '../src/info/infrastructure/http/info.controller';

describe('Info HTTP integration', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [InfoController],
      providers: [GetApiInfoUseCase],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/info', () => {
    it('responds with 200 OK', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.statusCode).toBe(200);
    });

    it('returns the API name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().name).toBe('EdificiOS Operations API');
    });

    it('returns the current release version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().version).toBe('0.13.0-alpha');
    });

    it('returns the environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().environment).toBe('development');
    });

    it('returns the bounded context', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().boundedContext).toBe('operations');
    });

    it('returns architecture with the four principles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().architecture).toEqual([
        'DDD',
        'Clean Architecture',
        'CQRS (Light)',
        'Event Sourcing',
      ]);
    });
  });
});
