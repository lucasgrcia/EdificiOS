import { CorrelationIdProvider } from '../correlation-id';
import {
  LogLevel,
  LoggerClock,
  LogWriter,
  StructuredLogEntry,
} from './logger';

export type ApplicationLoggerDependencies = {
  correlationIdProvider: CorrelationIdProvider;
  clock: LoggerClock;
  writer?: LogWriter;
};

const defaultWriter: LogWriter = {
  write(entry: StructuredLogEntry): void {
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  },
};

export class ApplicationLogger {
  constructor(private readonly dependencies: ApplicationLoggerDependencies) {}

  info(message: string): void {
    this.write('INFO', message);
  }

  error(message: string): void {
    this.write('ERROR', message);
  }

  private write(level: LogLevel, message: string): void {
    const writer = this.dependencies.writer ?? defaultWriter;

    writer.write({
      timestamp: this.dependencies.clock.now().toISOString(),
      level,
      correlationId: this.dependencies.correlationIdProvider.get(),
      message,
    });
  }
}
