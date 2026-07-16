import { Injectable, PipeTransform } from '@nestjs/common';

import { validateRequiredPathParam } from '../../../shared/http/validate-required-path-param';

@Injectable()
export class GetWorkOrderByIdParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return validateRequiredPathParam(value, 'Work order id is required.');
  }
}
