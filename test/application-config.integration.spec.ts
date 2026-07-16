import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';

import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';
import { InfoModule } from '../src/info/info.module';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/shared/http/swagger/setup-swagger';

describe('ApplicationConfig integration', () => {
  describe('ApplicationConfigModule', () => {
    it('exposes default configuration values', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule],
      }).compile();

      const applicationConfig = moduleRef.get(ApplicationConfig);

      expect(applicationConfig.name).toBe('EdificiOS API');
      expect(applicationConfig.version).toBe('0.18.0-alpha');
      expect(applicationConfig.environment).toBe('development');
      expect(applicationConfig.apiPrefix).toBe('/api/v1');
      expect(applicationConfig.swaggerPath).toBe('/api/docs');
      expect(applicationConfig.jwtSecret).toBe('edificios-dev-jwt-secret');
      expect(applicationConfig.jwtIssuer).toBe('edificios-api');
      expect(applicationConfig.jwtAudience).toBe('edificios-clients');
      expect(applicationConfig.jwtExpiration).toBe('1h');
    });

    it('provides ApplicationConfig as a singleton', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule],
      }).compile();

      const first = moduleRef.get(ApplicationConfig);
      const second = moduleRef.get(ApplicationConfig);

      expect(first).toBe(second);
    });
  });

  describe('Info consumption', () => {
    let app: NestFastifyApplication;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule, InfoModule],
      }).compile();

      app = await createFastifyTestApp(moduleRef);
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns configuration values from GET /api/v1/info', async () => {
      const applicationConfig = app.get(ApplicationConfig);
      const response = await app.inject({
        method: 'GET',
        url: `${applicationConfig.apiPrefix}/info`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        name: applicationConfig.name,
        version: applicationConfig.version,
        environment: applicationConfig.environment,
      });
    });
  });

  describe('Swagger consumption', () => {
    let app: NestFastifyApplication;
    let applicationConfig: ApplicationConfig;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication(new FastifyAdapter());
      applicationConfig = app.get(ApplicationConfig);
      await app.register(multipart);
      setupSwagger(app);
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('serves Swagger UI at the configured path', async () => {
      const response = await app.inject({
        method: 'GET',
        url: applicationConfig.swaggerPath,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('exposes OpenAPI metadata from ApplicationConfig', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${applicationConfig.swaggerPath}-json`,
      });

      const document = response.json() as OpenAPIObject;

      expect(response.statusCode).toBe(200);
      expect(document.info).toMatchObject({
        title: applicationConfig.name,
        description: expect.any(String),
        version: applicationConfig.version,
      });
    });
  });
});
