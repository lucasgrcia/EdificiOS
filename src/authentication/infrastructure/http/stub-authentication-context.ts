import { Injectable } from '@nestjs/common';

import { AuthenticationContext } from '../../application/authentication-context';

const STUB_USER_ID = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class StubAuthenticationContext implements AuthenticationContext {
  getCurrentUserId(): string {
    return STUB_USER_ID;
  }
}

export { STUB_USER_ID };
