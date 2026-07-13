import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';

import { AppModule } from '../src/app.module';
import { ApplicationConfig } from '../src/config/application-config';
import { setupSwagger } from '../src/shared/http/swagger/setup-swagger';

describe('Swagger HTTP integration', () => {
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

  describe('GET /api/docs', () => {
    it('responds with Swagger UI', async () => {
      const response = await app.inject({
        method: 'GET',
        url: applicationConfig.swaggerPath,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('swagger');
    });
  });

  describe('GET /api/docs-json', () => {
    let document: OpenAPIObject;

    beforeEach(async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${applicationConfig.swaggerPath}-json`,
      });

      expect(response.statusCode).toBe(200);
      document = response.json() as OpenAPIObject;
    });

    it('exposes the OpenAPI JSON document', () => {
      expect(document.openapi).toMatch(/^3\./);
      expect(document.info.title).toBe('EdificiOS API');
    });

    it('contains Operations endpoints', () => {
      const operationsPaths = Object.keys(document.paths).filter((path) =>
        path.startsWith('/api/v1/operations'),
      );

      expect(operationsPaths.length).toBeGreaterThan(0);
      expect(operationsPaths).toEqual(
        expect.arrayContaining(['/api/v1/operations/incidents']),
      );
    });

    it('contains Health endpoint', () => {
      expect(document.paths['/api/v1/health']).toBeDefined();
      expect(document.paths['/api/v1/health'].get).toBeDefined();
    });

    it('contains Info endpoint', () => {
      expect(document.paths['/api/v1/info']).toBeDefined();
      expect(document.paths['/api/v1/info'].get).toBeDefined();
    });

    it('contains version 0.15.0-alpha', () => {
      expect(document.info.version).toBe(applicationConfig.version);
      expect(document.info.version).toBe('0.15.0-alpha');
    });

    it('contains Problem Details as error schema', () => {
      expect(document.components?.schemas?.ProblemDetailsSchema).toEqual(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            type: expect.any(Object),
            title: expect.any(Object),
            status: expect.any(Object),
            detail: expect.any(Object),
            instance: expect.any(Object),
            correlationId: expect.any(Object),
          }),
        }),
      );

      const incidentGet = document.paths['/api/v1/operations/incidents']?.get;
      const badRequestResponse = incidentGet?.responses?.['400'];

      expect(badRequestResponse).toEqual(
        expect.objectContaining({
          content: expect.objectContaining({
            'application/problem+json': expect.objectContaining({
              schema: expect.objectContaining({
                $ref: '#/components/schemas/ProblemDetailsSchema',
              }),
            }),
          }),
        }),
      );
    });
  });
});
