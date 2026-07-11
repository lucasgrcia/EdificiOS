import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { GetNotificationByIdUseCase } from '../src/operations/application/get-notification-by-id-use-case';
import { ListNotificationsUseCase } from '../src/operations/application/list-notifications-use-case';
import { NotificationView } from '../src/operations/application/notification-view';
import { GetNotificationByIdParamsPipe } from '../src/operations/infrastructure/http/get-notification-by-id-params.pipe';
import { ListNotificationsByActorParamsPipe } from '../src/operations/infrastructure/http/list-notifications-by-actor-params.pipe';
import { NotificationQueryController } from '../src/operations/infrastructure/http/notification-query.controller';

describe('Notification query HTTP integration', () => {
  const actorId = '00000000-0000-0000-0000-000000000020';
  const notificationId = '00000000-0000-0000-0000-000000000001';
  const olderNotification: NotificationView = {
    id: '00000000-0000-0000-0000-000000000001',
    recipientId: actorId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Se detectó una nueva incidencia.',
    createdAt: '2026-07-10T08:00:00.000Z',
  };
  const newerNotification: NotificationView = {
    id: '00000000-0000-0000-0000-000000000002',
    recipientId: actorId,
    type: 'INCIDENT_ASSIGNED',
    channel: 'IN_APP',
    status: 'SENT',
    message: 'Se te asignó una incidencia.',
    createdAt: '2026-07-10T10:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let getNotificationByIdUseCase: { execute: jest.Mock };
  let listNotificationsUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getNotificationByIdUseCase = {
      execute: jest.fn().mockResolvedValue(olderNotification),
    };
    listNotificationsUseCase = {
      execute: jest.fn().mockResolvedValue([newerNotification, olderNotification]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationQueryController],
      providers: [
        GetNotificationByIdParamsPipe,
        ListNotificationsByActorParamsPipe,
        {
          provide: GetNotificationByIdUseCase,
          useValue: getNotificationByIdUseCase,
        },
        {
          provide: ListNotificationsUseCase,
          useValue: listNotificationsUseCase,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/operations/notifications/:id', () => {
    it('returns 200 OK with the notification view', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/notifications/${notificationId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(olderNotification);
      expect(getNotificationByIdUseCase.execute).toHaveBeenCalledWith({
        notificationId,
      });
    });

    it('returns 404 when notification is not found', async () => {
      getNotificationByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/notifications/${notificationId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Notification was not found.');
    });

    it('returns the expected notification response shape', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/notifications/${notificationId}`,
      });

      expect(response.json()).toEqual({
        id: expect.any(String),
        recipientId: expect.any(String),
        type: expect.any(String),
        channel: expect.any(String),
        status: expect.any(String),
        message: expect.any(String),
        createdAt: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/operations/actors/:actorId/notifications', () => {
    it('returns 200 OK with notifications for the recipient', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}/notifications`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([newerNotification, olderNotification]);
      expect(listNotificationsUseCase.execute).toHaveBeenCalledWith({
        recipientId: actorId,
      });
    });

    it('returns 200 OK with an empty list when recipient has no notifications', async () => {
      listNotificationsUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}/notifications`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it('returns notifications ordered by createdAt desc', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}/notifications`,
      });

      const body = response.json() as NotificationView[];

      expect(body).toHaveLength(2);
      expect(body[0].createdAt).toBe('2026-07-10T10:00:00.000Z');
      expect(body[1].createdAt).toBe('2026-07-10T08:00:00.000Z');
      expect(
        new Date(body[0].createdAt).getTime(),
      ).toBeGreaterThan(new Date(body[1].createdAt).getTime());
    });

    it('returns the expected notification list response shape', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}/notifications`,
      });

      expect(response.json()).toEqual([
        {
          id: expect.any(String),
          recipientId: expect.any(String),
          type: expect.any(String),
          channel: expect.any(String),
          status: expect.any(String),
          message: expect.any(String),
          createdAt: expect.any(String),
        },
        {
          id: expect.any(String),
          recipientId: expect.any(String),
          type: expect.any(String),
          channel: expect.any(String),
          status: expect.any(String),
          message: expect.any(String),
          createdAt: expect.any(String),
        },
      ]);
    });
  });
});
