import { ApiProperty } from '@nestjs/swagger';

export class ProblemDetailsSchema {
  @ApiProperty({
    example: 'https://api.edificios/errors/not-found',
    description: 'URI that identifies the problem type.',
  })
  type!: string;

  @ApiProperty({
    example: 'Not Found',
    description: 'Short, human-readable summary of the problem.',
  })
  title!: string;

  @ApiProperty({
    example: 404,
    description: 'HTTP status code.',
  })
  status!: number;

  @ApiProperty({
    example: 'Resource was not found.',
    description: 'Human-readable explanation specific to this occurrence.',
  })
  detail!: string;

  @ApiProperty({
    example: '/api/v1/operations/incidents/123',
    description: 'URI reference that identifies the specific occurrence.',
  })
  instance!: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nullable: true,
    description: 'Correlation identifier for distributed tracing.',
  })
  correlationId!: string | null;
}
