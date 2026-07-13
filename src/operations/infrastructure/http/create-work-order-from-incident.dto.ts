import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkOrderFromIncidentRequestDto {
  @ApiProperty()
  description!: string;
}
