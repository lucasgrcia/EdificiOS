import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';

import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';
import { InfoModule } from '../src/info/info.module';

describe('Info HTTP integration', () => {
  let app: NestFastifyApplication;
  let applicationConfig: ApplicationConfig;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, InfoModule],
    }).compile();

    applicationConfig = moduleRef.get(ApplicationConfig);

    app = await createFastifyTestApp(moduleRef);
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

      expect(response.json().name).toBe('EdificiOS API');
    });

    it('returns the current release version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.json().version).toBe(applicationConfig.version);
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
