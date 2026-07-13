export interface AuthenticationContext {
  getCurrentUserId(): string | null;
}

export const AUTHENTICATION_CONTEXT = Symbol('AUTHENTICATION_CONTEXT');
