import { ApiProperty } from '@nestjs/swagger';

export class StartShiftRequestDto {
  @ApiProperty({ format: 'uuid' })
  actorId!: string;

  @ApiProperty()
  shiftType!: string;
}
