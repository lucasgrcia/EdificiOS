import { Injectable, PipeTransform } from '@nestjs/common';

import { validateRequiredPathParam } from '../../../shared/http/validate-required-path-param';

@Injectable()
export class ListEvidenceByEventParamsPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return validateRequiredPathParam(value, 'Event id is required.');
  }
}
