import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Multipart } from '@fastify/multipart';

import { MimeType } from '../../domain/evidence/value-objects/mime-type';
import { CaptureEvidenceRequestDto } from './capture-evidence.dto';

@Injectable()
export class CaptureEvidenceMultipartPipe
  implements PipeTransform<FastifyRequest, Promise<CaptureEvidenceRequestDto>>
{
  async transform(request: FastifyRequest): Promise<CaptureEvidenceRequestDto> {
    let actorId: string | null = null;
    let caption: string | null = null;
    let fileContent: Buffer | null = null;
    let fileMimeType: string | null = null;
    let fileName: string | undefined;

    const parts = request.parts() as AsyncIterableIterator<Multipart>;

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'actorId') {
          actorId = this.readFieldValue(part.value);
        }

        if (part.fieldname === 'caption') {
          caption = this.readFieldValue(part.value);
        }

        continue;
      }

      if (part.fieldname !== 'file') {
        await part.toBuffer();
        throw new BadRequestException('Unexpected file field.');
      }

      if (fileContent !== null) {
        await part.toBuffer();
        throw new BadRequestException('Only one file is allowed.');
      }

      fileMimeType = part.mimetype.trim().toLowerCase();
      fileName = part.filename;
      fileContent = await part.toBuffer();
    }

    if (actorId === null || actorId.trim().length === 0) {
      throw new BadRequestException('Actor id is required.');
    }

    if (fileContent === null || fileMimeType === null) {
      throw new BadRequestException('Evidence file is required.');
    }

    try {
      MimeType.create(fileMimeType);
    } catch {
      throw new BadRequestException('Mime type is not supported.');
    }

    if (fileContent.byteLength === 0) {
      throw new BadRequestException('Evidence file is required.');
    }

    return {
      actorId: actorId.trim(),
      caption:
        caption === null || caption.trim().length === 0 ? null : caption.trim(),
      content: fileContent,
      mimeType: fileMimeType,
      storageReference: this.buildStorageReference(fileName),
    };
  }

  private readFieldValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Invalid multipart field value.');
    }

    return value;
  }

  private buildStorageReference(filename: string | undefined): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const sanitizedFilename = (filename ?? 'evidence.bin').replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );

    return `${year}/${month}/${randomUUID()}-${sanitizedFilename}`;
  }
}
