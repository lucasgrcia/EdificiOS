import { CorrelationIdProvider } from '../src/shared/correlation-id';
import { ApplicationLogger } from '../src/shared/logging/application-logger';
import { StructuredLogEntry } from '../src/shared/logging/logger';

function createCapturingLogger(options?: {
  correlationIdProvider?: CorrelationIdProvider;
  timestamp?: string;
}) {
  const entries: StructuredLogEntry[] = [];
  const correlationIdProvider =
    options?.correlationIdProvider ?? new CorrelationIdProvider();
  const logger = new ApplicationLogger({
    correlationIdProvider,
    clock: {
      now: () => new Date(options?.timestamp ?? '2026-07-11T14:00:00.000Z'),
    },
    writer: {
      write(entry) {
        entries.push(entry);
      },
    },
  });

  return {
    entries,
    logger,
    correlationIdProvider,
  };
}

describe('ApplicationLogger integration', () => {
  const correlationId = '00000000-0000-0000-0000-0000000000c1';
  const timestamp = '2026-07-11T14:00:00.000Z';

  it('includes correlationId in structured logs', () => {
    const { entries, logger, correlationIdProvider } = createCapturingLogger({
      timestamp,
    });

    correlationIdProvider.runWithCorrelationId(correlationId, () => {
      logger.info('DetectIncidentUseCase started');
    });

    expect(entries[0].correlationId).toBe(correlationId);
  });

  it('includes timestamp in structured logs', () => {
    const { entries, logger } = createCapturingLogger({ timestamp });

    logger.info('DetectIncidentUseCase started');

    expect(entries[0].timestamp).toBe(timestamp);
  });

  it('uses the correct log level', () => {
    const { entries, logger } = createCapturingLogger({ timestamp });

    logger.info('DetectIncidentUseCase started');
    logger.error('DetectIncidentUseCase failed');

    expect(entries[0].level).toBe('INFO');
    expect(entries[1].level).toBe('ERROR');
  });

  it('keeps the same correlationId throughout an operation', () => {
    const { entries, logger, correlationIdProvider } = createCapturingLogger({
      timestamp,
    });

    correlationIdProvider.runWithCorrelationId(correlationId, () => {
      logger.info('DetectIncidentUseCase started');
      logger.info('DetectIncidentUseCase completed');
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      timestamp,
      level: 'INFO',
      correlationId,
      message: 'DetectIncidentUseCase started',
    });
    expect(entries[1]).toEqual({
      timestamp,
      level: 'INFO',
      correlationId,
      message: 'DetectIncidentUseCase completed',
    });
  });
});
