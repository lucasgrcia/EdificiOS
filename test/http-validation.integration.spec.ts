import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  MiddlewareConsumer,
  Module,
  NestModule,
  PipeTransform,
  Post,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { CorrelationIdProvider } from '../src/shared/correlation-id';
import { CorrelationIdMiddleware } from '../src/shared/http/correlation-id.middleware';
import {
  HTTP_VALIDATION_MESSAGES,
  JSON_CONTENT_TYPE,
} from '../src/shared/http/http-validation';
import { HttpValidationPipe } from '../src/shared/http/http-validation.pipe';
import {
  PROBLEM_DETAILS_CONTENT_TYPE,
  PROBLEM_TYPE_BAD_REQUEST,
  ProblemDetails,
} from '../src/shared/http/problem-details';
import { ProblemDetailsFilter } from '../src/shared/http/problem-details.filter';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EchoRequestDto = {
  name: string;
};

@Injectable()
class EchoRequestPipe implements PipeTransform<unknown, EchoRequestDto> {
  transform(value: unknown): EchoRequestDto {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('name' in value) ||
      typeof value.name !== 'string' ||
      value.name.trim().length === 0
    ) {
      throw new BadRequestException('name is required.');
    }

    return {
      name: value.name.trim(),
    };
  }
}

@Controller('test')
class HttpValidationProbeController {
  @Get()
  getWithoutBody(): { ok: true } {
    return { ok: true };
  }

  @Post('echo')
  postEcho(
    @Body(EchoRequestPipe) body: EchoRequestDto,
  ): EchoRequestDto {
    return body;
  }
}

@Module({
  controllers: [HttpValidationProbeController],
  providers: [
    CorrelationIdProvider,
    CorrelationIdMiddleware,
    EchoRequestPipe,
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
})
class HttpValidationTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

describe('HTTP validation integration', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpValidationTestModule],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('HttpValidationPipe', () => {
    it('allows GET without body', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    });

    it('allows POST with valid JSON object and runs route pipe after', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/echo',
        headers: {
          'content-type': JSON_CONTENT_TYPE,
        },
        payload: {
          name: 'edificios',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ name: 'edificios' });
    });

    it('rejects POST with null body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/echo',
        headers: {
          'content-type': JSON_CONTENT_TYPE,
        },
        payload: 'null',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        detail: HTTP_VALIDATION_MESSAGES.BODY_NULL,
      });
    });

    it('rejects POST with invalid JSON object payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/echo',
        headers: {
          'content-type': JSON_CONTENT_TYPE,
        },
        payload: ['not', 'an', 'object'],
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        detail: HTTP_VALIDATION_MESSAGES.BODY_MUST_BE_JSON_OBJECT,
      });
    });

    it('rejects POST with incorrect Content-Type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/echo',
        headers: {
          'content-type': 'text/plain',
        },
        payload: JSON.stringify({ name: 'edificios' }),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        detail: HTTP_VALIDATION_MESSAGES.INVALID_CONTENT_TYPE,
      });
    });

    it('returns Problem Details for validation failures', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/echo',
        headers: {
          'content-type': JSON_CONTENT_TYPE,
        },
        payload: 'null',
      });

      const body = response.json() as ProblemDetails;

      expect(response.headers['content-type']).toContain(
        PROBLEM_DETAILS_CONTENT_TYPE,
      );
      expect(body).toEqual({
        type: PROBLEM_TYPE_BAD_REQUEST,
        title: 'Bad Request',
        status: 400,
        detail: HTTP_VALIDATION_MESSAGES.BODY_NULL,
        instance: '/test/echo',
        correlationId: expect.stringMatching(UUID_V4_PATTERN),
      });
    });
  });
});
