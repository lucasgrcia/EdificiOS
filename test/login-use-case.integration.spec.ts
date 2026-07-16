import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { LoginUseCase } from '../src/authentication/application/login-use-case';
import { UserQueryRepository } from '../src/authentication/application/user-query-persistence';
import { AuthenticationJwtModule } from '../src/authentication/infrastructure/jwt/authentication-jwt.module';
import { NestJwtTokenIssuer } from '../src/authentication/infrastructure/jwt/nest-jwt-token-issuer';
import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';

describe('LoginUseCase integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';
  const email = 'demo@edificios.local';
  const authenticatedUser: AuthenticatedUserView = {
    id: userId,
    email,
    displayName: 'Demo User',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  let loginUseCase: LoginUseCase;
  let userQueryRepository: UserQueryRepository;
  let jwtService: JwtService;
  let applicationConfig: ApplicationConfig;

  beforeEach(async () => {
    userQueryRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(async () => authenticatedUser),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, AuthenticationJwtModule],
      providers: [
        NestJwtTokenIssuer,
        {
          provide: LoginUseCase,
          inject: [NestJwtTokenIssuer],
          useFactory: (jwtTokenIssuer: NestJwtTokenIssuer) =>
            new LoginUseCase({
              userQueryRepository,
              jwtTokenIssuer,
            }),
        },
      ],
    }).compile();

    loginUseCase = moduleRef.get(LoginUseCase);
    jwtService = moduleRef.get(JwtService);
    applicationConfig = moduleRef.get(ApplicationConfig);
  });

  it('issues an access token when the user exists', async () => {
    const result = await loginUseCase.execute({ email });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.expiresIn).toBe(3600);
    expect(userQueryRepository.findByEmail).toHaveBeenCalledWith(email);
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    userQueryRepository.findByEmail = jest.fn(async () => null);

    await expect(
      loginUseCase.execute({ email: 'missing@edificios.local' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('includes userId in the issued JWT', async () => {
    const result = await loginUseCase.execute({ email });

    const decoded = jwtService.verify(result.accessToken, {
      secret: applicationConfig.jwtSecret,
      issuer: applicationConfig.jwtIssuer,
      audience: applicationConfig.jwtAudience,
    }) as { userId: string };

    expect(decoded.userId).toBe(userId);
  });

  it('includes issuer in the issued JWT', async () => {
    const result = await loginUseCase.execute({ email });

    const decoded = jwtService.verify(result.accessToken, {
      secret: applicationConfig.jwtSecret,
      issuer: applicationConfig.jwtIssuer,
      audience: applicationConfig.jwtAudience,
    }) as { iss: string };

    expect(decoded.iss).toBe(applicationConfig.jwtIssuer);
  });

  it('includes audience in the issued JWT', async () => {
    const result = await loginUseCase.execute({ email });

    const decoded = jwtService.verify(result.accessToken, {
      secret: applicationConfig.jwtSecret,
      issuer: applicationConfig.jwtIssuer,
      audience: applicationConfig.jwtAudience,
    }) as { aud: string };

    expect(decoded.aud).toBe(applicationConfig.jwtAudience);
  });
});
