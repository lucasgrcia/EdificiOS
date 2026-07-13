import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'porter@torre-norte.edificios' })
  email!: string;

  @ApiProperty({ example: 'Carlos Porter' })
  displayName!: string;
}
