import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class GetWorkOrderByIdParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Work order id is required.');
    }

    return trimmed;
  }
}
