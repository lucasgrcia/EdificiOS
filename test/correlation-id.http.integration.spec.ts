import {
  Controller,
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import {
  CORRELATION_ID_HEADER,
  CorrelationIdProvider,
} from '../src/shared/correlation-id';
import { CorrelationIdMiddleware } from '../src/shared/http/correlation-id.middleware';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('test')
class CorrelationProbeController {
  constructor(private readonly correlationIdProvider: CorrelationIdProvider) {}

  @Get('correlation-id')
  getCorrelationId(): {
    first: string | null;
    second: string | null;
  } {
    return {
      first: this.correlationIdProvider.get(),
      second: this.correlationIdProvider.get(),
    };
  }
}

@Module({
  controllers: [CorrelationProbeController],
  providers: [CorrelationIdProvider, CorrelationIdMiddleware],
})
class CorrelationTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

describe('Correlation ID HTTP integration', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CorrelationTestModule],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('CorrelationIdMiddleware', () => {
    it('generates a valid UUID for each request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/correlation-id',
      });

      const correlationId = response.headers[CORRELATION_ID_HEADER];

      expect(response.statusCode).toBe(200);
      expect(correlationId).toEqual(expect.stringMatching(UUID_V4_PATTERN));
    });

    it('keeps the same correlationId within a single request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/correlation-id',
      });

      const body = response.json();

      expect(body.first).toEqual(expect.stringMatching(UUID_V4_PATTERN));
      expect(body.second).toBe(body.first);
      expect(response.headers[CORRELATION_ID_HEADER]).toBe(body.first);
    });

    it('generates different correlationIds for different requests', async () => {
      const firstResponse = await app.inject({
        method: 'GET',
        url: '/test/correlation-id',
      });
      const secondResponse = await app.inject({
        method: 'GET',
        url: '/test/correlation-id',
      });

      const firstCorrelationId = firstResponse.headers[CORRELATION_ID_HEADER];
      const secondCorrelationId = secondResponse.headers[CORRELATION_ID_HEADER];

      expect(firstCorrelationId).toEqual(
        expect.stringMatching(UUID_V4_PATTERN),
      );
      expect(secondCorrelationId).toEqual(
        expect.stringMatching(UUID_V4_PATTERN),
      );
      expect(firstCorrelationId).not.toBe(secondCorrelationId);
    });

    it('registers the middleware globally for HTTP routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/correlation-id',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers[CORRELATION_ID_HEADER]).toEqual(
        expect.stringMatching(UUID_V4_PATTERN),
      );
      expect(response.json().first).toBe(
        response.headers[CORRELATION_ID_HEADER],
      );
    });
  });
});
