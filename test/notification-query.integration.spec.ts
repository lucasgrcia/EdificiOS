import { GetNotificationByIdUseCase } from '../src/operations/application/get-notification-by-id-use-case';
import { ListNotificationsUseCase } from '../src/operations/application/list-notifications-use-case';
import { NotificationQueryRepository } from '../src/operations/application/notification-query-persistence';
import { NotificationView } from '../src/operations/application/notification-view';
import { PostgresNotificationQueryRepository } from '../src/operations/infrastructure/persistence/postgres-notification-query-repository';

describe('Notification query integration', () => {
  const recipientId = '00000000-0000-0000-0000-000000000020';
  const otherRecipientId = '00000000-0000-0000-0000-000000000030';
  const olderNotification = {
    id: '00000000-0000-0000-0000-000000000001',
    recipient_id: recipientId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Se detectó una nueva incidencia.',
    created_at: new Date('2026-07-10T08:00:00.000Z'),
  };
  const newerNotification = {
    id: '00000000-0000-0000-0000-000000000002',
    recipient_id: recipientId,
    type: 'INCIDENT_ASSIGNED',
    channel: 'IN_APP',
    status: 'SENT',
    message: 'Se te asignó una incidencia.',
    created_at: new Date('2026-07-10T10:00:00.000Z'),
  };
  const otherRecipientNotification = {
    id: '00000000-0000-0000-0000-000000000003',
    recipient_id: otherRecipientId,
    type: 'WORK_ORDER_STARTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Comenzó una orden de trabajo asignada a ti.',
    created_at: new Date('2026-07-10T09:00:00.000Z'),
  };
  const expectedOlderView: NotificationView = {
    id: olderNotification.id,
    recipientId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Se detectó una nueva incidencia.',
    createdAt: '2026-07-10T08:00:00.000Z',
  };
  const expectedNewerView: NotificationView = {
    id: newerNotification.id,
    recipientId,
    type: 'INCIDENT_ASSIGNED',
    channel: 'IN_APP',
    status: 'SENT',
    message: 'Se te asignó una incidencia.',
    createdAt: '2026-07-10T10:00:00.000Z',
  };

  function createInMemoryPool() {
    const notifications = new Map<
      string,
      typeof olderNotification | typeof newerNotification | typeof otherRecipientNotification
    >();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('FROM notifications') && sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = notifications.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [record],
          };
        }

        if (
          sql.includes('FROM notifications') &&
          sql.includes('WHERE recipient_id = $1')
        ) {
          const [queryRecipientId] = values as [string];
          const rows = [...notifications.values()]
            .filter((record) => record.recipient_id === queryRecipientId)
            .sort(
              (left, right) =>
                right.created_at.getTime() - left.created_at.getTime(),
            );

          return {
            rowCount: rows.length,
            rows,
          };
        }

        if (sql.includes('FROM notifications') && sql.includes('LIMIT $1')) {
          const rows = [...notifications.values()].sort(
            (left, right) =>
              right.created_at.getTime() - left.created_at.getTime(),
          );

          return {
            rowCount: rows.length,
            rows,
          };
        }

        throw new Error(`Unexpected query: ${sql}`);
      }),
      seed: (
        record:
          | typeof olderNotification
          | typeof newerNotification
          | typeof otherRecipientNotification,
      ) => {
        notifications.set(record.id, record);
      },
    };
  }

  describe('PostgresNotificationQueryRepository', () => {
    it('returns null when notification is not found by id', async () => {
      const pool = {
        query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
      };
      const repository = new PostgresNotificationQueryRepository(pool as never);

      const result = await repository.findById(
        '00000000-0000-0000-0000-000000000099',
      );

      expect(result).toBeNull();
    });

    it('loads a notification view by id', async () => {
      const queries: Array<{ sql: string; values: unknown[] }> = [];
      const pool = {
        query: jest.fn(async (sql: string, values?: unknown[]) => {
          queries.push({ sql: sql.trim(), values: values ?? [] });
          return {
            rowCount: 1,
            rows: [olderNotification],
          };
        }),
      };
      const repository = new PostgresNotificationQueryRepository(pool as never);

      const result = await repository.findById(olderNotification.id);

      expect(result).toEqual(expectedOlderView);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toContain('FROM notifications');
      expect(queries[0].values).toEqual([olderNotification.id]);
    });

    it('returns notifications by recipient ordered by created_at desc', async () => {
      const pool = createInMemoryPool();
      pool.seed(olderNotification);
      pool.seed(newerNotification);
      pool.seed(otherRecipientNotification);
      const repository = new PostgresNotificationQueryRepository(pool as never);

      const result = await repository.findByRecipient(recipientId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedNewerView);
      expect(result[1]).toEqual(expectedOlderView);
    });

    it('returns an empty list when recipient has no notifications', async () => {
      const pool = createInMemoryPool();
      pool.seed(otherRecipientNotification);
      const repository = new PostgresNotificationQueryRepository(pool as never);

      const result = await repository.findByRecipient(recipientId);

      expect(result).toEqual([]);
    });
  });

  describe('Notification query use cases', () => {
    function createHarness(views: NotificationView[]) {
      const notificationQueryRepository: NotificationQueryRepository = {
        findById: jest.fn(
          async (id) => views.find((view) => view.id === id) ?? null,
        ),
        findByRecipient: jest.fn(async (queryRecipientId) =>
          views.filter((view) => view.recipientId === queryRecipientId),
        ),
        findRecent: jest.fn(async () => []),
      };

      return {
        getNotificationByIdUseCase: new GetNotificationByIdUseCase({
          notificationQueryRepository,
        }),
        listNotificationsUseCase: new ListNotificationsUseCase({
          notificationQueryRepository,
        }),
        notificationQueryRepository,
      };
    }

    it('returns a notification view by id', async () => {
      const harness = createHarness([expectedOlderView, expectedNewerView]);

      const result = await harness.getNotificationByIdUseCase.execute({
        notificationId: expectedOlderView.id,
      });

      expect(result).toEqual(expectedOlderView);
      expect(harness.notificationQueryRepository.findById).toHaveBeenCalledWith(
        expectedOlderView.id,
      );
    });

    it('returns null when notification id does not exist', async () => {
      const harness = createHarness([expectedOlderView]);

      const result = await harness.getNotificationByIdUseCase.execute({
        notificationId: '00000000-0000-0000-0000-000000000099',
      });

      expect(result).toBeNull();
    });

    it('lists notifications by recipient through repository delegation', async () => {
      const harness = createHarness([expectedOlderView, expectedNewerView]);

      const result = await harness.listNotificationsUseCase.execute({
        recipientId,
      });

      expect(result).toEqual([expectedOlderView, expectedNewerView]);
      expect(
        harness.notificationQueryRepository.findByRecipient,
      ).toHaveBeenCalledWith(recipientId);
    });

    it('returns an empty list when recipient has no notifications', async () => {
      const harness = createHarness([]);

      const result = await harness.listNotificationsUseCase.execute({
        recipientId,
      });

      expect(result).toEqual([]);
    });
  });
});
