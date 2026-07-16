import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  IssuedAccessToken,
  JwtTokenIssuer,
} from '../../application/jwt-token-issuer';
import { ApplicationConfig } from '../../../config/application-config';

function resolveExpirationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (match === null) {
    return 3600;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return 3600;
  }
}

@Injectable()
export class NestJwtTokenIssuer implements JwtTokenIssuer {
  constructor(
    private readonly jwtService: JwtService,
    private readonly applicationConfig: ApplicationConfig,
  ) {}

  issueAccessToken(userId: string): IssuedAccessToken {
    const expiresIn = resolveExpirationSeconds(
      this.applicationConfig.jwtExpiration,
    );

    const accessToken = this.jwtService.sign(
      { userId },
      {
        secret: this.applicationConfig.jwtSecret,
        expiresIn: this.applicationConfig.jwtExpiration,
        issuer: this.applicationConfig.jwtIssuer,
        audience: this.applicationConfig.jwtAudience,
      },
    );

    return {
      accessToken,
      expiresIn,
    };
  }
}
