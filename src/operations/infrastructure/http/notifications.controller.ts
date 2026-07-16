import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/http/jwt-authentication.guard';
import {
  CreateNotificationResult,
  CreateNotificationUseCase,
} from '../../application/create-notification-use-case';
import { CreateNotificationRequestPipe } from './create-notification-request.pipe';
import { CreateNotificationRequestDto } from './notification.dto';

@UseGuards(JwtAuthenticationGuard)
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
