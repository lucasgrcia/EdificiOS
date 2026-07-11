import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ListNotificationsByActorParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Actor id is required.');
    }

    return trimmed;
  }
}
