import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class GetIncidentByIdParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Incident id is required.');
    }

    return trimmed;
  }
}
