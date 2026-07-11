export type HealthCheckStatus = 'UP';

export type HealthView = {
  status: HealthCheckStatus;
  timestamp: string;
  version: string;
  checks: {
    database: HealthCheckStatus;
    operations: HealthCheckStatus;
  };
};
