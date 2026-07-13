import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationRequestDto {
  @ApiProperty({ format: 'uuid' })
  recipientId!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  channel!: string;

  @ApiProperty()
  message!: string;
}
