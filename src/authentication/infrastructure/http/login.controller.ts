import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { LoginResult } from '../../application/login-use-case';
import { LoginUseCase } from '../../application/login-use-case';
import { LoginRequestDto } from './login.dto';
import { LoginRequestPipe } from './login-request.pipe';

@Controller('api/v1/authentication')
@ApiTags('Authentication')
export class LoginController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Issues an access token for an existing user email.',
  })
  login(@Body(LoginRequestPipe) body: LoginRequestDto): Promise<LoginResult> {
    return this.loginUseCase.execute({
      email: body.email,
    });
  }
}
