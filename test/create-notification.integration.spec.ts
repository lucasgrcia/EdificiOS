import { NotificationRecord } from '../src/operations/application/notification-persistence';
import { CreateNotificationUseCase } from '../src/operations/application/create-notification-use-case';

describe('CreateNotificationUseCase integration', () => {
  const notificationId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000020';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const command = {
    recipientId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    message: 'Se detectó una fuga en la bomba principal.',
  };

  function createRepository() {
    const notifications = new Map<string, NotificationRecord>();

    return {
      save: jest.fn(async (record: NotificationRecord) => {
        notifications.set(record.id, structuredClone(record));
      }),
      findById: jest.fn(),
      findByRecipient: jest.fn(),
      notifications,
    };
  }

  function createUseCase(
    notificationRepository: ReturnType<typeof createRepository>,
  ) {
    return new CreateNotificationUseCase({
      notificationRepository,
      idGenerator: {
        generate: () => notificationId,
      },
      clock: {
        now: () => createdAt,
      },
    });
  }

  it('creates notification correctly', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    const persisted = notificationRepository.notifications.get(notificationId);

    expect(persisted).toEqual({
      id: notificationId,
      recipientId,
      type: 'INCIDENT_DETECTED',
      channel: 'IN_APP',
      status: 'PENDING',
      message: 'Se detectó una fuga en la bomba principal.',
      createdAt,
    });
  });

  it('persists exactly one record', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationRepository.notifications.size).toBe(1);
  });

  it('returns notificationId', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    const result = await useCase.execute(command);

    expect(result).toEqual({ notificationId });
  });

  it('persists message from command', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(notificationRepository.notifications.get(notificationId)?.message).toBe(
      command.message,
    );
  });

  it('persists recipient from command', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(
      notificationRepository.notifications.get(notificationId)?.recipientId,
    ).toBe(recipientId);
  });

  it('persists channel from command', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(notificationRepository.notifications.get(notificationId)?.channel).toBe(
      'IN_APP',
    );
  });

  it('persists type from command', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(notificationRepository.notifications.get(notificationId)?.type).toBe(
      'INCIDENT_DETECTED',
    );
  });

  it('persists initial status as PENDING', async () => {
    const notificationRepository = createRepository();
    const useCase = createUseCase(notificationRepository);

    await useCase.execute(command);

    expect(notificationRepository.notifications.get(notificationId)?.status).toBe(
      'PENDING',
    );
  });
});
