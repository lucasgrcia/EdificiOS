import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserView } from '../../application/authenticated-user-view';
import { CreateUserResult } from '../../application/create-user-use-case';
import { CreateUserUseCase } from '../../application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from '../../application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../../application/get-current-user-use-case';
import {
  CURRENT_USER_AUTH_DESCRIPTION,
  SECURITY_SCHEME_BEARER,
} from '../../../shared/http/swagger/swagger.constants';
import { CreateUserRequestDto } from './create-user.dto';
import { CreateUserRequestPipe } from './create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from './get-authenticated-user-params.pipe';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';

@Controller('api/v1/authentication')
@ApiTags('Authentication')
export class AuthenticatedUserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(CreateUserRequestPipe) body: CreateUserRequestDto,
  ): Promise<CreateUserResult> {
    return this.createUserUseCase.execute({
      email: body.email,
      displayName: body.displayName,
    });
  }

  @Get('users/:id')
  getById(
    @Param('id', GetAuthenticatedUserParamsPipe) userId: string,
  ): Promise<AuthenticatedUserView> {
    return this.getAuthenticatedUserUseCase
      .execute({ userId })
      .then((user) => {
        if (user === null) {
          throw new NotFoundException('User was not found.');
        }

        return user;
      });
  }

  @Get('me')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth(SECURITY_SCHEME_BEARER)
  @ApiOperation({
    summary: 'Get current user',
    description: CURRENT_USER_AUTH_DESCRIPTION,
  })
  getCurrentUser(): Promise<AuthenticatedUserView> {
    return this.getCurrentUserUseCase.execute();
  }
}
