export type LogLevel = 'INFO' | 'ERROR';

export type StructuredLogEntry = {
  timestamp: string;
  level: LogLevel;
  correlationId: string | null;
  message: string;
};

export type LoggerClock = {
  now(): Date;
};

export type LogWriter = {
  write(entry: StructuredLogEntry): void;
};
