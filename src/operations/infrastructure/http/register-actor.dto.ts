import { ApiProperty } from '@nestjs/swagger';

export class RegisterActorRequestDto {
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;
}
