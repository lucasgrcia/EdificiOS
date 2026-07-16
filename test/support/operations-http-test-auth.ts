import {
  AUTHENTICATION_CONTEXT,
  type AuthenticationContext,
} from '../../src/authentication/application/authentication-context';
import { JwtAuthenticationGuard } from '../../src/authentication/infrastructure/http/jwt-authentication.guard';

export const operationsHttpTestAuthProviders = [
  JwtAuthenticationGuard,
  {
    provide: AUTHENTICATION_CONTEXT,
    useValue: {
      getCurrentUserId: () => '00000000-0000-0000-0000-000000000010',
    } satisfies AuthenticationContext,
  },
];
