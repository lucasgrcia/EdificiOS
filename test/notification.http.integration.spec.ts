import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';

import { CreateNotificationUseCase } from '../src/operations/application/create-notification-use-case';
import { CreateNotificationRequestPipe } from '../src/operations/infrastructure/http/create-notification-request.pipe';
import { NotificationsController } from '../src/operations/infrastructure/http/notifications.controller';
import { operationsHttpTestAuthProviders } from './support/operations-http-test-auth';

describe('Notification HTTP integration', () => {
  const notificationId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000020';

  let app: NestFastifyApplication;
  let createNotificationUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({ notificationId }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        ...operationsHttpTestAuthProviders,
        CreateNotificationRequestPipe,
        {
          provide: CreateNotificationUseCase,
          useValue: createNotificationUseCase,
        },
      ],
    }).compile();

    app = await createFastifyTestApp(moduleRef);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/operations/notifications', () => {
    it('returns 201 Created with the notification id', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId,
          type: 'INCIDENT_DETECTED',
          channel: 'IN_APP',
          message: 'Se detectó una nueva incidencia.',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ notificationId });
    });

    it('adapts request body to CreateNotificationUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId: ` ${recipientId.toUpperCase()} `,
          type: ' INCIDENT_DETECTED ',
          channel: ' in_app ',
          message: ' Se detectó una nueva incidencia. ',
        },
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith({
        recipientId,
        type: 'INCIDENT_DETECTED',
        channel: 'in_app',
        message: 'Se detectó una nueva incidencia.',
      });
    });

    it('returns 400 when recipientId is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId: 'invalid-recipient',
          type: 'INCIDENT_DETECTED',
          channel: 'IN_APP',
          message: 'Se detectó una nueva incidencia.',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Recipient id must be a valid UUID.');
      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when message is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId,
          type: 'INCIDENT_DETECTED',
          channel: 'IN_APP',
          message: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Notification message is required.');
      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when type is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId,
          type: '   ',
          channel: 'IN_APP',
          message: 'Se detectó una nueva incidencia.',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Notification type is required.');
      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when channel is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/notifications',
        payload: {
          recipientId,
          type: 'INCIDENT_DETECTED',
          channel: '   ',
          message: 'Se detectó una nueva incidencia.',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Notification channel is required.');
      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
