import { Controller, Get, Param } from '@nestjs/common';

import { AssetResult } from '../../application/asset-result';
import { ListAssetsBySiteUseCase } from '../../application/list-assets-by-site-use-case';

@Controller('api/v1/operations/sites')
export class SitesController {
  constructor(
    private readonly listAssetsBySiteUseCase: ListAssetsBySiteUseCase,
  ) {}

  @Get(':siteId/assets')
  listBySite(@Param('siteId') siteId: string): Promise<AssetResult[]> {
    return this.listAssetsBySiteUseCase.execute({ siteId });
  }
}
