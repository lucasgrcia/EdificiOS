import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ListEvidenceByEventParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Event id is required.');
    }

    return trimmed;
  }
}
