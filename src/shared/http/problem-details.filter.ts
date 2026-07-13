import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CorrelationIdProvider } from '../correlation-id';
import {
  PROBLEM_DETAILS_CONTENT_TYPE,
  PROBLEM_TYPE_BAD_REQUEST,
  PROBLEM_TYPE_CONFLICT,
  PROBLEM_TYPE_FORBIDDEN,
  PROBLEM_TYPE_INTERNAL_SERVER_ERROR,
  PROBLEM_TYPE_NOT_FOUND,
  ProblemDetails,
} from './problem-details';

type ProblemMapping = {
  type: string;
  title: string;
  status: number;
};

const PROBLEM_MAPPINGS: Array<{
  exceptionClass: new (...args: never[]) => HttpException;
  mapping: ProblemMapping;
}> = [
  {
    exceptionClass: NotFoundException,
    mapping: {
      type: PROBLEM_TYPE_NOT_FOUND,
      title: 'Not Found',
      status: 404,
    },
  },
  {
    exceptionClass: BadRequestException,
    mapping: {
      type: PROBLEM_TYPE_BAD_REQUEST,
      title: 'Bad Request',
      status: 400,
    },
  },
  {
    exceptionClass: ConflictException,
    mapping: {
      type: PROBLEM_TYPE_CONFLICT,
      title: 'Conflict',
      status: 409,
    },
  },
  {
    exceptionClass: ForbiddenException,
    mapping: {
      type: PROBLEM_TYPE_FORBIDDEN,
      title: 'Forbidden',
      status: 403,
    },
  },
  {
    exceptionClass: InternalServerErrorException,
    mapping: {
      type: PROBLEM_TYPE_INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      status: 500,
    },
  },
];

function extractDetail(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const message = response.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return exception.message;
}

function resolveProblemMapping(exception: unknown): ProblemMapping {
  if (exception instanceof HttpException) {
    for (const entry of PROBLEM_MAPPINGS) {
      if (exception instanceof entry.exceptionClass) {
        return entry.mapping;
      }
    }
  }

  return {
    type: PROBLEM_TYPE_INTERNAL_SERVER_ERROR,
    title: 'Internal Server Error',
    status: 500,
  };
}

function buildProblemDetails(input: {
  exception: unknown;
  instance: string;
  correlationId: string | null;
}): ProblemDetails {
  const mapping = resolveProblemMapping(input.exception);
  const detail =
    input.exception instanceof HttpException
      ? extractDetail(input.exception)
      : 'An unexpected error occurred.';

  return {
    type: mapping.type,
    title: mapping.title,
    status: mapping.status,
    detail,
    instance: input.instance,
    correlationId: input.correlationId,
  };
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly correlationIdProvider: CorrelationIdProvider) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const problem = buildProblemDetails({
      exception,
      instance: request.url,
      correlationId: this.correlationIdProvider.get(),
    });

    void response
      .status(problem.status)
      .header('content-type', PROBLEM_DETAILS_CONTENT_TYPE)
      .send(problem);
  }
}
