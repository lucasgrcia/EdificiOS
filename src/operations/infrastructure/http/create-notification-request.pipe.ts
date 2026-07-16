import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { CreateNotificationRequestDto } from './notification.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class CreateNotificationRequestPipe
  implements PipeTransform<unknown, CreateNotificationRequestDto>
{
  transform(value: unknown): CreateNotificationRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Notification payload is required.');
    }

    return {
      recipientId: this.readRecipientId(value),
      type: readRequiredString(
        value,
        'type',
        'Notification type is required.',
      ),
      channel: readRequiredString(
        value,
        'channel',
        'Notification channel is required.',
      ),
      message: readRequiredString(
        value,
        'message',
        'Notification message is required.',
      ),
    };
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
}
