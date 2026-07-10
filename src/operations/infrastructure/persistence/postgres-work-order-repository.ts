import { Pool } from 'pg';

import {
  WorkOrderRecord,
  WorkOrderRepository,
} from '../../application/work-order-persistence';

export class PostgresWorkOrderRepository implements WorkOrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(workOrder: WorkOrderRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO work_orders (
          id,
          incident_id,
          actor_id,
          status,
          description,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        workOrder.id,
        workOrder.incidentId,
        workOrder.actorId,
        workOrder.status,
        workOrder.description,
        workOrder.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<WorkOrderRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          incident_id,
          actor_id,
          status,
          description,
          created_at
        FROM work_orders
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toWorkOrderRecord(result.rows[0]);
  }

  async findByIncident(incidentId: string): Promise<WorkOrderRecord[]> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          incident_id,
          actor_id,
          status,
          description,
          created_at
        FROM work_orders
        WHERE incident_id = $1
        ORDER BY created_at
      `,
      [incidentId],
    );

    return result.rows.map((row) => this.toWorkOrderRecord(row));
  }

  async update(workOrder: WorkOrderRecord): Promise<void> {
    const result = await this.pool.query(
      `
        UPDATE work_orders
        SET
          incident_id = $2,
          actor_id = $3,
          status = $4,
          description = $5,
          created_at = $6
        WHERE id = $1
      `,
      [
        workOrder.id,
        workOrder.incidentId,
        workOrder.actorId,
        workOrder.status,
        workOrder.description,
        workOrder.createdAt,
      ],
    );

    if (result.rowCount !== 1) {
      throw new Error('Work order was not updated.');
    }
  }

  private toWorkOrderRecord(row: {
    id: string;
    incident_id: string;
    actor_id: string;
    status: string;
    description: string;
    created_at: Date;
  }): WorkOrderRecord {
    return {
      id: row.id,
      incidentId: row.incident_id,
      actorId: row.actor_id,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}
