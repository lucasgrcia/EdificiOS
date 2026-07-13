import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAssetRequestDto {
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  manufacturer?: string | null;

  @ApiPropertyOptional({ nullable: true })
  model?: string | null;

  @ApiPropertyOptional({ nullable: true })
  serialNumber?: string | null;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  criticality!: string;
}
