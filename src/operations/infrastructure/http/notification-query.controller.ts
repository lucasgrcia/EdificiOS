import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';

import { GetNotificationByIdUseCase } from '../../application/get-notification-by-id-use-case';
import { ListNotificationsUseCase } from '../../application/list-notifications-use-case';
import { NotificationView } from '../../application/notification-view';
import { GetNotificationByIdParamsPipe } from './get-notification-by-id-params.pipe';
import { ListNotificationsByActorParamsPipe } from './list-notifications-by-actor-params.pipe';

@Controller('api/v1/operations')
export class NotificationQueryController {
  constructor(
    private readonly getNotificationByIdUseCase: GetNotificationByIdUseCase,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
  ) {}

  @Get('notifications/:id')
  getById(
    @Param('id', GetNotificationByIdParamsPipe) notificationId: string,
  ): Promise<NotificationView> {
    return this.getNotificationByIdUseCase
      .execute({ notificationId })
      .then((notification) => {
        if (notification === null) {
          throw new NotFoundException('Notification was not found.');
        }

        return notification;
      });
  }

  @Get('actors/:actorId/notifications')
  listByActor(
    @Param('actorId', ListNotificationsByActorParamsPipe) actorId: string,
  ): Promise<NotificationView[]> {
    return this.listNotificationsUseCase.execute({ recipientId: actorId });
  }
}
