import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ApplicationConfig } from '../../../config/application-config';
import { AuthenticationContext } from '../../application/authentication-context';
import { AuthenticationHttpContext } from './authentication-http-context';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type JwtUserPayload = {
  userId?: unknown;
};

function extractBearerToken(authorization: string | undefined): string | null {
  if (authorization === undefined) {
    return null;
  }

  const trimmed = authorization.trim();
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);

  if (match === null) {
    return null;
  }

  const token = match[1];

  if (token.length === 0) {
    return null;
  }

  return token;
}

@Injectable()
export class JWTAuthenticationContext implements AuthenticationContext {
  constructor(
    private readonly jwtService: JwtService,
    private readonly applicationConfig: ApplicationConfig,
    private readonly authenticationHttpContext: AuthenticationHttpContext,
  ) {}

  getCurrentUserId(): string | null {
    const token = extractBearerToken(
      this.authenticationHttpContext.getAuthorizationHeader(),
    );

    if (token === null) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<JwtUserPayload>(token, {
        secret: this.applicationConfig.jwtSecret,
        issuer: this.applicationConfig.jwtIssuer,
        audience: this.applicationConfig.jwtAudience,
      });

      if (typeof payload.userId !== 'string') {
        return null;
      }

      const userId = payload.userId.trim();

      if (!UUID_PATTERN.test(userId)) {
        return null;
      }

      return userId.toLowerCase();
    } catch {
      return null;
    }
  }
}
