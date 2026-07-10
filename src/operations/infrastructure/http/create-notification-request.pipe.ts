import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { CreateNotificationRequestDto } from './notification.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class CreateNotificationRequestPipe
  implements PipeTransform<unknown, CreateNotificationRequestDto>
{
  transform(value: unknown): CreateNotificationRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Notification payload is required.');
    }

    return {
      recipientId: this.readRecipientId(value),
      type: this.readRequiredString(
        value,
        'type',
        'Notification type is required.',
      ),
      channel: this.readRequiredString(
        value,
        'channel',
        'Notification channel is required.',
      ),
      message: this.readRequiredString(
        value,
        'message',
        'Notification message is required.',
      ),
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readRecipientId(value: Record<string, unknown>): string {
    if (!('recipientId' in value) || typeof value.recipientId !== 'string') {
      throw new BadRequestException('Recipient id is required.');
    }

    const trimmed = value.recipientId.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Recipient id is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new BadRequestException('Recipient id must be a valid UUID.');
    }

    return trimmed.toLowerCase();
  }

  private readRequiredString(
    value: Record<string, unknown>,
    field: string,
    message: string,
  ): string {
    if (!(field in value) || typeof value[field] !== 'string') {
      throw new BadRequestException(message);
    }

    const trimmed = value[field].trim();

    if (trimmed.length === 0) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }
}
