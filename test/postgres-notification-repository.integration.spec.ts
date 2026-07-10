import { NotificationRecord } from '../src/operations/application/notification-persistence';
import { PostgresNotificationRepository } from '../src/operations/infrastructure/persistence/postgres-notification-repository';

describe('PostgresNotificationRepository integration', () => {
  const recipientId = '00000000-0000-0000-0000-000000000020';
  const otherRecipientId = '00000000-0000-0000-0000-000000000030';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const laterCreatedAt = new Date('2026-07-10T10:00:00.000Z');
  const notification: NotificationRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    recipientId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Se detectó una fuga en la bomba principal.',
    createdAt,
  };
  const secondNotification: NotificationRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    recipientId,
    type: 'WORK_ORDER_CREATED',
    channel: 'EMAIL',
    status: 'SENT',
    message: 'Se creó una orden de trabajo.',
    createdAt: laterCreatedAt,
  };
  const otherRecipientNotification: NotificationRecord = {
    id: '00000000-0000-0000-0000-000000000003',
    recipientId: otherRecipientId,
    type: 'SHIFT_STARTED',
    channel: 'PUSH',
    status: 'READ',
    message: 'El turno de mañana ha comenzado.',
    createdAt,
  };

  function createInMemoryPool() {
    const notifications = new Map<string, NotificationRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO notifications')) {
          const [
            id,
            recordRecipientId,
            type,
            channel,
            status,
            message,
            recordCreatedAt,
          ] = values as [string, string, string, string, string, string, Date];

          notifications.set(id, {
            id,
            recipientId: recordRecipientId,
            type,
            channel,
            status,
            message,
            createdAt: recordCreatedAt,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('FROM notifications') && sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = notifications.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [
              {
                id: record.id,
                recipient_id: record.recipientId,
                type: record.type,
                channel: record.channel,
                status: record.status,
                message: record.message,
                created_at: record.createdAt,
              },
            ],
          };
        }

        if (sql.includes('WHERE recipient_id = $1')) {
          const [recordRecipientId] = values as [string];
          const rows = [...notifications.values()]
            .filter((record) => record.recipientId === recordRecipientId)
            .sort(
              (left, right) =>
                right.createdAt.getTime() - left.createdAt.getTime(),
            )
            .map((record) => ({
              id: record.id,
              recipient_id: record.recipientId,
              type: record.type,
              channel: record.channel,
              status: record.status,
              message: record.message,
              created_at: record.createdAt,
            }));

          return {
            rowCount: rows.length,
            rows,
          };
        }

        throw new Error(`Unexpected query: ${sql}`);
      }),
    };
  }

  it('persists a notification', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresNotificationRepository(pool as never);

    await repository.save(notification);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO notifications');
    expect(queries[0].values).toEqual([
      notification.id,
      notification.recipientId,
      notification.type,
      notification.channel,
      notification.status,
      notification.message,
      notification.createdAt,
    ]);
  });

  it('returns null when notification is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresNotificationRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted notification by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: notification.id,
            recipient_id: notification.recipientId,
            type: notification.type,
            channel: notification.channel,
            status: notification.status,
            message: notification.message,
            created_at: notification.createdAt,
          },
        ],
      })),
    };
    const repository = new PostgresNotificationRepository(pool as never);

    const result = await repository.findById(notification.id);

    expect(result).toEqual(notification);
  });

  it('loads notifications by recipient ordered by created at descending', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresNotificationRepository(pool as never);

    await repository.save(notification);
    await repository.save(secondNotification);
    await repository.save(otherRecipientNotification);

    const result = await repository.findByRecipient(recipientId);

    expect(result).toEqual([secondNotification, notification]);
  });

  it('returns an empty list when recipient has no notifications', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresNotificationRepository(pool as never);

    await repository.save(otherRecipientNotification);

    const result = await repository.findByRecipient(recipientId);

    expect(result).toEqual([]);
  });
});
