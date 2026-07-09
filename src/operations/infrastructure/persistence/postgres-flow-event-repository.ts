import { PoolClient } from 'pg';

import {
  FlowEventRecord,
  FlowEventRepository,
} from '../../application/detect-incident-use-case';

export class PostgresFlowEventRepository implements FlowEventRepository {
  constructor(private readonly client: PoolClient) {}

  async save(event: FlowEventRecord): Promise<void> {
    await this.client.query(
      `
        INSERT INTO events (
          id,
          aggregate_type,
          aggregate_id,
          incident_id,
          name,
          schema_version,
          correlation_id,
          causation_id,
          actor_id,
          payload,
          occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
      `,
      [
        event.id,
        event.aggregateType,
        event.aggregateId,
        event.incidentId,
        event.name,
        event.schemaVersion,
        event.correlationId,
        event.causationId,
        event.actorId,
        JSON.stringify(event.payload),
        event.occurredAt,
      ],
    );
  }
}
