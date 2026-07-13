import { ApiProperty } from '@nestjs/swagger';

export class DetectIncidentRequestDto {
  @ApiProperty({ format: 'uuid' })
  assetId!: string;

  @ApiProperty()
  description!: string;
}
