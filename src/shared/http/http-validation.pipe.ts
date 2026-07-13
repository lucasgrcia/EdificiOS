import {
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

import { validateHttpJsonBody } from './http-validation';

@Injectable({ scope: Scope.REQUEST })
export class HttpValidationPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: FastifyRequest) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') {
      return value;
    }

    return validateHttpJsonBody({
      value,
      contentType: this.request.headers['content-type'],
      contentLength: this.request.headers['content-length'],
    });
  }
}
