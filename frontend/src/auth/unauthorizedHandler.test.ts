import {
  notifyUnauthorized,
  registerUnauthorizedHandler,
  resetUnauthorizedHandling,
  suppressUnauthorizedNotifications,
} from './unauthorizedHandler';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('unauthorizedHandler', () => {
  beforeEach(() => {
    registerUnauthorizedHandler(null);
    resetUnauthorizedHandling();
    suppressUnauthorizedNotifications(false);
  });

  it('invokes the registered handler only once for concurrent 401s', () => {
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);

    notifyUnauthorized();
    notifyUnauthorized();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not notify while session restoration suppresses unauthorized handling', () => {
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);
    suppressUnauthorizedNotifications(true);

    notifyUnauthorized();

    expect(handler).not.toHaveBeenCalled();
  });
});
