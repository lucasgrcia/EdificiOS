import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { ActorResult } from '../../application/actor-result';
import { GetActorByIdUseCase } from '../../application/get-actor-by-id-use-case';
import { RegisterActorUseCase } from '../../application/register-actor-use-case';
import { RegisterActorRequestDto } from './register-actor.dto';
import { RegisterActorRequestPipe } from './register-actor-request.pipe';

@Controller('api/v1/operations/actors')
export class ActorsController {
  constructor(
    private readonly registerActorUseCase: RegisterActorUseCase,
    private readonly getActorByIdUseCase: GetActorByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(
    @Body(RegisterActorRequestPipe) body: RegisterActorRequestDto,
  ): Promise<ActorResult> {
    return this.registerActorUseCase.execute({
      siteId: body.siteId,
      name: body.name,
      role: body.role,
      status: body.status,
    });
  }

  @Get(':id')
  getById(@Param('id') actorId: string): Promise<ActorResult> {
    return this.getActorByIdUseCase.execute({ actorId }).then((actor) => {
      if (actor === null) {
        throw new NotFoundException('Actor was not found.');
      }

      return actor;
    });
  }
}
