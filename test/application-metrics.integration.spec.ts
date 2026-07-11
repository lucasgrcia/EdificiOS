import { ApplicationMetrics } from '../src/shared/metrics/application-metrics';
import {
  INCIDENT_DETECT_FAILURE_METRIC,
  INCIDENT_DETECT_SUCCESS_METRIC,
} from '../src/shared/metrics/metrics-view';

describe('ApplicationMetrics integration', () => {
  let metrics: ApplicationMetrics;

  beforeEach(() => {
    metrics = new ApplicationMetrics();
  });

  it('increments a metric counter', () => {
    metrics.increment(INCIDENT_DETECT_SUCCESS_METRIC);
    metrics.increment(INCIDENT_DETECT_SUCCESS_METRIC);

    expect(metrics.get(INCIDENT_DETECT_SUCCESS_METRIC)).toBe(2);
  });

  it('returns a snapshot of all counters', () => {
    metrics.increment(INCIDENT_DETECT_SUCCESS_METRIC);
    metrics.increment(INCIDENT_DETECT_FAILURE_METRIC);

    expect(metrics.snapshot()).toEqual({
      [INCIDENT_DETECT_SUCCESS_METRIC]: 1,
      [INCIDENT_DETECT_FAILURE_METRIC]: 1,
    });
  });

  it('tracks success counters independently', () => {
    metrics.increment(INCIDENT_DETECT_SUCCESS_METRIC);

    expect(metrics.get(INCIDENT_DETECT_SUCCESS_METRIC)).toBe(1);
    expect(metrics.get(INCIDENT_DETECT_FAILURE_METRIC)).toBe(0);
  });

  it('tracks failure counters independently', () => {
    metrics.increment(INCIDENT_DETECT_FAILURE_METRIC);

    expect(metrics.get(INCIDENT_DETECT_FAILURE_METRIC)).toBe(1);
    expect(metrics.get(INCIDENT_DETECT_SUCCESS_METRIC)).toBe(0);
  });

  it('resets all counters', () => {
    metrics.increment(INCIDENT_DETECT_SUCCESS_METRIC);
    metrics.increment(INCIDENT_DETECT_FAILURE_METRIC);

    metrics.reset();

    expect(metrics.snapshot()).toEqual({});
    expect(metrics.get(INCIDENT_DETECT_SUCCESS_METRIC)).toBe(0);
    expect(metrics.get(INCIDENT_DETECT_FAILURE_METRIC)).toBe(0);
  });
});
