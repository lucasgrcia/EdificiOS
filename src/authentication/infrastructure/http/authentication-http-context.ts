import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

type AuthenticationHttpStore = {
  authorization: string | undefined;
};

@Injectable()
export class AuthenticationHttpContext {
  private readonly storage = new AsyncLocalStorage<AuthenticationHttpStore>();

  runWithAuthorization<T>(authorization: string | undefined, callback: () => T): T {
    return this.storage.run({ authorization }, callback);
  }

  getAuthorizationHeader(): string | undefined {
    return this.storage.getStore()?.authorization;
  }
}
