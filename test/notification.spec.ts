import { NotificationAggregate } from '../src/operations/domain/notification/notification';
import { NotificationChannel } from '../src/operations/domain/notification/value-objects/notification-channel';
import { NotificationId } from '../src/operations/domain/notification/value-objects/notification-id';
import { NotificationMessage } from '../src/operations/domain/notification/value-objects/notification-message';
import { NotificationRecipient } from '../src/operations/domain/notification/value-objects/notification-recipient';
import { NotificationStatus } from '../src/operations/domain/notification/value-objects/notification-status';
import { NotificationType } from '../src/operations/domain/notification/value-objects/notification-type';

describe('Notification value objects', () => {
  const notificationUuid = '00000000-0000-0000-0000-000000000001';
  const recipientUuid = '00000000-0000-0000-0000-000000000020';

  describe('NotificationId', () => {
    it('creates a valid notification id from a UUID', () => {
      expect(
        NotificationId.create(` ${notificationUuid.toUpperCase()} `).toString(),
      ).toBe(notificationUuid);
    });

    it('rejects an empty notification id', () => {
      expect(() => NotificationId.create('   ')).toThrow(
        'Notification id is required.',
      );
    });

    it('rejects an invalid notification id', () => {
      expect(() => NotificationId.create('notification-1')).toThrow(
        'Notification id must be a valid UUID.',
      );
    });
  });

  describe('NotificationType', () => {
    it.each([
      'INCIDENT_DETECTED',
      'WORK_ORDER_CREATED',
      'SHIFT_STARTED',
      'custom.notification.type',
    ])('accepts free text notification type %s', (type) => {
      expect(NotificationType.create(` ${type} `).toString()).toBe(type);
    });

    it('rejects an empty notification type', () => {
      expect(() => NotificationType.create('   ')).toThrow(
        'Notification type is required.',
      );
    });
  });

  describe('NotificationStatus', () => {
    it.each(['PENDING', 'SENT', 'FAILED', 'READ'])(
      'accepts supported notification status %s',
      (status) => {
        expect(NotificationStatus.create(status).toString()).toBe(status);
      },
    );

    it('normalizes notification status casing', () => {
      expect(NotificationStatus.create(' sent ').toString()).toBe('SENT');
    });

    it('rejects an empty notification status', () => {
      expect(() => NotificationStatus.create('   ')).toThrow(
        'Notification status is not supported.',
      );
    });

    it('rejects unsupported notification status', () => {
      expect(() => NotificationStatus.create('DELIVERED')).toThrow(
        'Notification status is not supported.',
      );
    });
  });

  describe('NotificationChannel', () => {
    it.each(['IN_APP', 'EMAIL', 'PUSH'])(
      'accepts supported notification channel %s',
      (channel) => {
        expect(NotificationChannel.create(channel).toString()).toBe(channel);
      },
    );

    it('normalizes notification channel casing', () => {
      expect(NotificationChannel.create(' in_app ').toString()).toBe('IN_APP');
    });

    it('rejects an empty notification channel', () => {
      expect(() => NotificationChannel.create('   ')).toThrow(
        'Notification channel is not supported.',
      );
    });

    it('rejects unsupported notification channel', () => {
      expect(() => NotificationChannel.create('SMS')).toThrow(
        'Notification channel is not supported.',
      );
    });

    it('rejects WhatsApp as unsupported channel', () => {
      expect(() => NotificationChannel.create('WHATSAPP')).toThrow(
        'Notification channel is not supported.',
      );
    });
  });

  describe('NotificationMessage', () => {
    it('creates a valid notification message', () => {
      expect(
        NotificationMessage.create(' Se detectó una fuga en la bomba ').toString(),
      ).toBe('Se detectó una fuga en la bomba');
    });

    it('rejects an empty notification message', () => {
      expect(() => NotificationMessage.create('   ')).toThrow(
        'Notification message is required.',
      );
    });

    it('rejects a notification message that exceeds the maximum length', () => {
      expect(() =>
        NotificationMessage.create('a'.repeat(501)),
      ).toThrow('Notification message exceeds the maximum length.');
    });
  });

  describe('NotificationRecipient', () => {
    it('creates a valid notification recipient from a UUID', () => {
      expect(
        NotificationRecipient.create(` ${recipientUuid.toUpperCase()} `).toString(),
      ).toBe(recipientUuid);
    });

    it('rejects an empty notification recipient', () => {
      expect(() => NotificationRecipient.create('   ')).toThrow(
        'Notification recipient is required.',
      );
    });

    it('rejects an invalid notification recipient', () => {
      expect(() => NotificationRecipient.create('actor-1')).toThrow(
        'Notification recipient must be a valid UUID.',
      );
    });
  });
});

describe('NotificationAggregate', () => {
  const validInput = {
    notificationId: '00000000-0000-0000-0000-000000000001',
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    message: 'Se detectó una fuga en la bomba principal.',
    recipient: '00000000-0000-0000-0000-000000000020',
  };

  it('creates a valid notification in PENDING status', () => {
    const notification = NotificationAggregate.create(validInput);

    expect(notification.id).toBe(validInput.notificationId);
    expect(notification.type).toBe(validInput.type);
    expect(notification.channel).toBe('IN_APP');
    expect(notification.message).toBe(validInput.message);
    expect(notification.recipient).toBe(validInput.recipient);
    expect(notification.status).toBe('PENDING');
  });

  it('rehydrates a notification with persisted status', () => {
    const notification = NotificationAggregate.rehydrate({
      ...validInput,
      status: 'SENT',
    });

    expect(notification.status).toBe('SENT');
    expect(notification.type).toBe(validInput.type);
    expect(notification.channel).toBe('IN_APP');
  });

  it('rejects create when notification id is empty', () => {
    expect(() =>
      NotificationAggregate.create({
        ...validInput,
        notificationId: '   ',
      }),
    ).toThrow('Notification id is required.');
  });

  it('rejects rehydrate when notification id is empty', () => {
    expect(() =>
      NotificationAggregate.rehydrate({
        ...validInput,
        notificationId: '   ',
        status: 'PENDING',
      }),
    ).toThrow('Notification id is required.');
  });

  it('rejects create when message is empty', () => {
    expect(() =>
      NotificationAggregate.create({
        ...validInput,
        message: '   ',
      }),
    ).toThrow('Notification message is required.');
  });

  it('rejects create when recipient is invalid', () => {
    expect(() =>
      NotificationAggregate.create({
        ...validInput,
        recipient: 'invalid-recipient',
      }),
    ).toThrow('Notification recipient must be a valid UUID.');
  });

  it('rejects create when channel is invalid', () => {
    expect(() =>
      NotificationAggregate.create({
        ...validInput,
        channel: 'SMS',
      }),
    ).toThrow('Notification channel is not supported.');
  });

  it('rejects rehydrate when status is invalid', () => {
    expect(() =>
      NotificationAggregate.rehydrate({
        ...validInput,
        status: 'DELIVERED' as never,
      }),
    ).toThrow('Notification status is not supported.');
  });

  it('exposes immutable state through getters without mutators', () => {
    const notification = NotificationAggregate.create(validInput);

    expect(notification.id).toBe(validInput.notificationId);
    expect(notification.type).toBe(validInput.type);
    expect(notification.channel).toBe('IN_APP');
    expect(notification.message).toBe(validInput.message);
    expect(notification.recipient).toBe(validInput.recipient);
    expect(notification.status).toBe('PENDING');
    expect(Object.getOwnPropertyNames(notification)).not.toContain('update');
    expect(Object.getOwnPropertyNames(notification)).not.toContain('patch');
    expect(Object.getOwnPropertyNames(notification)).not.toContain('delete');
  });

  it('preserves values after rehydrate without mutating the original shape', () => {
    const original = NotificationAggregate.create(validInput);
    const rehydrated = NotificationAggregate.rehydrate({
      ...validInput,
      status: 'READ',
    });

    expect(original.status).toBe('PENDING');
    expect(rehydrated.status).toBe('READ');
    expect(rehydrated.message).toBe(original.message);
    expect(rehydrated.recipient).toBe(original.recipient);
  });
});
