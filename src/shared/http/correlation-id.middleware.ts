import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ServerResponse } from 'node:http';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  CORRELATION_ID_HEADER,
  CorrelationIdProvider,
} from '../correlation-id';

type MiddlewareReply = FastifyReply | ServerResponse;

function setCorrelationIdHeader(
  reply: MiddlewareReply,
  correlationId: string,
): void {
  if ('header' in reply && typeof reply.header === 'function') {
    void reply.header(CORRELATION_ID_HEADER, correlationId);
    return;
  }

  (reply as ServerResponse).setHeader(CORRELATION_ID_HEADER, correlationId);
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly correlationIdProvider: CorrelationIdProvider) {}

  use(
    _request: FastifyRequest,
    reply: MiddlewareReply,
    next: (error?: Error) => void,
  ): void {
    const correlationId = randomUUID();

    setCorrelationIdHeader(reply, correlationId);

    this.correlationIdProvider.runWithCorrelationId(correlationId, () => {
      next();
    });
  }
}
