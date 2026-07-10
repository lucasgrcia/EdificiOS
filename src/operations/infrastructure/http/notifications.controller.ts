import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import {
  CreateNotificationResult,
  CreateNotificationUseCase,
} from '../../application/create-notification-use-case';
import { CreateNotificationRequestPipe } from './create-notification-request.pipe';
import { CreateNotificationRequestDto } from './notification.dto';

@Controller('api/v1/operations/notifications')
export class NotificationsController {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(CreateNotificationRequestPipe) body: CreateNotificationRequestDto,
  ): Promise<CreateNotificationResult> {
    return this.createNotificationUseCase.execute({
      recipientId: body.recipientId,
      type: body.type,
      channel: body.channel,
      message: body.message,
    });
  }
}
