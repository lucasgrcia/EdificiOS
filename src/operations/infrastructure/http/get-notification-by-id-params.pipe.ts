import { Injectable, PipeTransform } from '@nestjs/common';

import { validateRequiredPathParam } from '../../../shared/http/validate-required-path-param';

@Injectable()
export class GetNotificationByIdParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return validateRequiredPathParam(value, 'Notification id is required.');
  }
}
