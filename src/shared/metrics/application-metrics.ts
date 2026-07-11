import { MetricsView } from './metrics-view';

export class ApplicationMetrics {
  private readonly counters = new Map<string, number>();

  increment(metricName: string): void {
    this.counters.set(metricName, (this.counters.get(metricName) ?? 0) + 1);
  }

  get(metricName: string): number {
    return this.counters.get(metricName) ?? 0;
  }

  snapshot(): MetricsView {
    return Object.fromEntries(this.counters);
  }

  reset(): void {
    this.counters.clear();
  }
}
