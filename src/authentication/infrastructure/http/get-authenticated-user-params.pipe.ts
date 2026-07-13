import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetAuthenticatedUserParamsPipe
  implements PipeTransform<string, string>
{
  transform(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('User id is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new BadRequestException('User id must be a valid UUID.');
    }

    return trimmed.toLowerCase();
  }
}
