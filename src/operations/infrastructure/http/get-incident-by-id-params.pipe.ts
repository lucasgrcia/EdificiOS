import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { validateRequiredPathParam } from '../../../shared/http/validate-required-path-param';

@Injectable()
export class GetIncidentByIdParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return validateRequiredPathParam(value, 'Incident id is required.');
  }
}
