import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  InternalServerErrorException,
  MiddlewareConsumer,
  Module,
  NestModule,
  NotFoundException,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
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
import {
  PROBLEM_DETAILS_CONTENT_TYPE,
  PROBLEM_TYPE_BAD_REQUEST,
  PROBLEM_TYPE_CONFLICT,
  PROBLEM_TYPE_INTERNAL_SERVER_ERROR,
  PROBLEM_TYPE_NOT_FOUND,
  ProblemDetails,
} from '../src/shared/http/problem-details';
import { ProblemDetailsFilter } from '../src/shared/http/problem-details.filter';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('test')
class ProblemProbeController {
  @Get('not-found')
  notFound(): void {
    throw new NotFoundException('Resource was not found.');
  }

  @Get('bad-request')
  badRequest(): void {
    throw new BadRequestException('Invalid payload.');
  }

  @Get('conflict')
  conflict(): void {
    throw new ConflictException('State conflict.');
  }

  @Get('internal-error')
  internalError(): void {
    throw new InternalServerErrorException('Unexpected failure.');
  }
}

@Module({
  controllers: [ProblemProbeController],
  providers: [
    CorrelationIdProvider,
    CorrelationIdMiddleware,
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
class ProblemDetailsTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

describe('Problem Details HTTP integration', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProblemDetailsTestModule],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('ProblemDetailsFilter', () => {
    it('returns 404 as Problem Details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain(
        PROBLEM_DETAILS_CONTENT_TYPE,
      );
      expect(response.json()).toMatchObject({
        type: PROBLEM_TYPE_NOT_FOUND,
        title: 'Not Found',
        status: 404,
        detail: 'Resource was not found.',
        instance: '/test/not-found',
      });
    });

    it('returns 400 as Problem Details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/bad-request',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        type: PROBLEM_TYPE_BAD_REQUEST,
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid payload.',
        instance: '/test/bad-request',
      });
    });

    it('returns 409 as Problem Details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/conflict',
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({
        type: PROBLEM_TYPE_CONFLICT,
        title: 'Conflict',
        status: 409,
        detail: 'State conflict.',
        instance: '/test/conflict',
      });
    });

    it('returns 500 as Problem Details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/internal-error',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({
        type: PROBLEM_TYPE_INTERNAL_SERVER_ERROR,
        title: 'Internal Server Error',
        status: 500,
        detail: 'Unexpected failure.',
        instance: '/test/internal-error',
      });
    });

    it('includes correlationId from CorrelationIdProvider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
      });

      const body = response.json() as ProblemDetails;

      expect(body.correlationId).toEqual(
        expect.stringMatching(UUID_V4_PATTERN),
      );
      expect(response.headers[CORRELATION_ID_HEADER]).toBe(body.correlationId);
    });

    it('includes the request url as instance', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/conflict',
      });

      expect(response.json().instance).toBe('/test/conflict');
    });

    it('returns the RFC 9457 response shape', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/bad-request',
      });

      expect(response.json()).toEqual({
        type: PROBLEM_TYPE_BAD_REQUEST,
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid payload.',
        instance: '/test/bad-request',
        correlationId: expect.stringMatching(UUID_V4_PATTERN),
      });
    });
  });
});
