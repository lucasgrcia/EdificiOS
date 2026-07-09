import { Injectable } from '@nestjs/common';

import {
  Transaction,
  TransactionRunner,
} from '../../application/incident-persistence';
import { PostgresFlowEventRepository } from './postgres-flow-event-repository';
import { PostgresIncidentRepository } from './postgres-incident-repository';
import { PostgresOperationsPool } from './postgres-operations-pool';
import { PostgresOutboxRepository } from './postgres-outbox-repository';

@Injectable()
export class PostgresOperationsTransactionRunner implements TransactionRunner {
  constructor(private readonly operationsPool: PostgresOperationsPool) {}

  async run<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    const client = await this.operationsPool.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await work({
        incidents: new PostgresIncidentRepository(client),
        events: new PostgresFlowEventRepository(client),
        outbox: new PostgresOutboxRepository(client),
      });

      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
