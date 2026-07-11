import { WorkOrderQueryView } from './work-order-query-view';

export interface WorkOrderQueryRepository {
  findRecent(limit: number): Promise<WorkOrderQueryView[]>;
}
