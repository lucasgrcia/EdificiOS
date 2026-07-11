import { AsyncLocalStorage } from 'node:async_hooks';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

type CorrelationIdContext = {
  correlationId: string;
};

export class CorrelationIdProvider {
  private readonly storage = new AsyncLocalStorage<CorrelationIdContext>();

  runWithCorrelationId<T>(correlationId: string, callback: () => T): T {
    return this.storage.run({ correlationId }, callback);
  }

  get(): string | null {
    return this.storage.getStore()?.correlationId ?? null;
  }
}
