import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';

import { GetHealthUseCase } from '../src/health/application/get-health-use-case';
import { HealthController } from '../src/health/infrastructure/http/health.controller';

describe('Health HTTP integration', () => {
  const fixedTimestamp = new Date('2026-07-11T13:00:00.000Z');
  let app: NestFastifyApplication;
  let poolQuery: jest.Mock;

  beforeEach(async () => {
    poolQuery = jest
      .fn()
      .mockResolvedValue({ rowCount: 1, rows: [{ '?column?': 1 }] });

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GetHealthUseCase,
          useFactory: () =>
            new GetHealthUseCase({
              pool: {
                query: poolQuery,
              } as unknown as Pool,
              clock: {
                now: () => fixedTimestamp,
              },
            }),
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

  describe('GET /api/v1/health', () => {
    it('responds with 200 OK', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('returns status UP', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.json().status).toBe('UP');
    });

    it('returns the current release version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.json().version).toBe('0.13.0-alpha');
    });

    it('returns a timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.json().timestamp).toBe(fixedTimestamp.toISOString());
    });

    it('returns database check UP', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.json().checks.database).toBe('UP');
    });

    it('returns operations check UP', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.json().checks.operations).toBe('UP');
    });

    it('verifies database connectivity with SELECT 1', async () => {
      await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(poolQuery).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
