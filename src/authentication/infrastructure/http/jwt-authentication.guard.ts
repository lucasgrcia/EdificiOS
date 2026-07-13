import {
  CanActivate,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../../application/authentication-context';

@Injectable()
export class JwtAuthenticationGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_CONTEXT)
    private readonly authenticationContext: AuthenticationContext,
  ) {}

  canActivate(): boolean {
    const userId = this.authenticationContext.getCurrentUserId();

    if (userId === null) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
