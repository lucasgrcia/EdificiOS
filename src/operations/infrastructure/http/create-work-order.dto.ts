import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkOrderRequestDto {
  @ApiProperty({ format: 'uuid' })
  incidentId!: string;

  @ApiProperty({ format: 'uuid' })
  actorId!: string;

  @ApiProperty()
  description!: string;
}
