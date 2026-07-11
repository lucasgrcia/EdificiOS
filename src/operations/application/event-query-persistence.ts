import { EventQueryView } from './event-query-view';

export interface EventQueryRepository {
  findRecent(limit: number): Promise<EventQueryView[]>;
}
