import { toWorkOrderResult } from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type ListWorkOrdersByIncidentCommand = {
  incidentId: string;
};

export type ListWorkOrdersByIncidentUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
};

export class ListWorkOrdersByIncidentUseCase {
  constructor(
    private readonly dependencies: ListWorkOrdersByIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: ListWorkOrdersByIncidentCommand,
  ): Promise<WorkOrderResult[]> {
    const records = await this.dependencies.workOrderRepository.findByIncident(
      command.incidentId,
    );

    return records.map((record) => toWorkOrderResult(record));
  }
}
