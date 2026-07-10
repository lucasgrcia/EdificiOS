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

import { AssetResult } from '../../application/asset-result';
import { GetAssetByIdUseCase } from '../../application/get-asset-by-id-use-case';
import { RegisterAssetUseCase } from '../../application/register-asset-use-case';
import { SiteNotFoundError } from '../../domain/site/site-not-found';
import { RegisterAssetRequestDto } from './register-asset.dto';
import { RegisterAssetRequestPipe } from './register-asset-request.pipe';

@Controller('api/v1/operations/assets')
export class AssetsController {
  constructor(
    private readonly registerAssetUseCase: RegisterAssetUseCase,
    private readonly getAssetByIdUseCase: GetAssetByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(RegisterAssetRequestPipe) body: RegisterAssetRequestDto,
  ): Promise<AssetResult> {
    try {
      return await this.registerAssetUseCase.execute({
        siteId: body.siteId,
        name: body.name,
        type: body.type,
        manufacturer: body.manufacturer,
        model: body.model,
        serialNumber: body.serialNumber,
        location: body.location,
        criticality: body.criticality,
      });
    } catch (error) {
      if (error instanceof SiteNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Get(':id')
  getById(@Param('id') assetId: string): Promise<AssetResult> {
    return this.getAssetByIdUseCase.execute({ assetId }).then((asset) => {
      if (asset === null) {
        throw new NotFoundException('Asset was not found.');
      }

      return asset;
    });
  }
}
