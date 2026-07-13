import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ApplicationConfig } from '../../../config/application-config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ApplicationConfig],
      useFactory: (applicationConfig: ApplicationConfig) => ({
        secret: applicationConfig.jwtSecret,
        signOptions: {
          expiresIn: applicationConfig.jwtExpiration,
          issuer: applicationConfig.jwtIssuer,
          audience: applicationConfig.jwtAudience,
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthenticationJwtModule {}
