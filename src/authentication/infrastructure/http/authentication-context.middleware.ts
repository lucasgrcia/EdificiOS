import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthenticationHttpContext } from './authentication-http-context';

@Injectable()
export class AuthenticationContextMiddleware implements NestMiddleware {
  constructor(
    private readonly authenticationHttpContext: AuthenticationHttpContext,
  ) {}

  use(
    request: FastifyRequest,
    _reply: FastifyReply,
    next: (error?: Error) => void,
  ): void {
    this.authenticationHttpContext.runWithAuthorization(
      request.headers.authorization,
      () => {
        next();
      },
    );
  }
}
