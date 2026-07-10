export type WorkOrderRecord = {
  id: string;
  incidentId: string;
  actorId: string;
  status: string;
  description: string;
  createdAt: Date;
};

export interface WorkOrderRepository {
  save(workOrder: WorkOrderRecord): Promise<void>;
  findById(id: string): Promise<WorkOrderRecord | null>;
  findByIncident(incidentId: string): Promise<WorkOrderRecord[]>;
  update(workOrder: WorkOrderRecord): Promise<void>;
}
