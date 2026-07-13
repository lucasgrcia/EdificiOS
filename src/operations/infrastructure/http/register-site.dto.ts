import { ApiProperty } from '@nestjs/swagger';

export class RegisterSiteRequestDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  timeZone!: string;

  @ApiProperty()
  buildingType!: string;
}
