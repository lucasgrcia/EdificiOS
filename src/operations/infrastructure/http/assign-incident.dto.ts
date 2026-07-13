import { ApiProperty } from '@nestjs/swagger';

export class AssignIncidentRequestDto {
  @ApiProperty({ format: 'uuid' })
  actorId!: string;
}
