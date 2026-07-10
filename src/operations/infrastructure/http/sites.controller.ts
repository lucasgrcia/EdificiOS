import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { AssetResult } from '../../application/asset-result';
import { GetActiveShiftUseCase } from '../../application/get-active-shift-use-case';
import { GetSiteByIdUseCase } from '../../application/get-site-by-id-use-case';
import { ListAssetsBySiteUseCase } from '../../application/list-assets-by-site-use-case';
import { ListSitesUseCase } from '../../application/list-sites-use-case';
import { RegisterSiteUseCase } from '../../application/register-site-use-case';
import { StartShiftUseCase } from '../../application/start-shift-use-case';
import { ShiftResult } from '../../application/shift-result';
import { SiteResult } from '../../application/site-result';
import { ActiveShiftAlreadyExistsError } from '../../domain/shift/active-shift-already-exists';
import { MultipleActiveShiftsError } from '../../domain/shift/multiple-active-shifts';
import { RegisterSiteRequestDto } from './register-site.dto';
import { RegisterSiteRequestPipe } from './register-site-request.pipe';
import { StartShiftRequestDto } from './start-shift.dto';
import { StartShiftRequestPipe } from './start-shift-request.pipe';

@Controller('api/v1/operations/sites')
export class SitesController {
  constructor(
    private readonly registerSiteUseCase: RegisterSiteUseCase,
    private readonly getSiteByIdUseCase: GetSiteByIdUseCase,
    private readonly listSitesUseCase: ListSitesUseCase,
    private readonly listAssetsBySiteUseCase: ListAssetsBySiteUseCase,
    private readonly startShiftUseCase: StartShiftUseCase,
    private readonly getActiveShiftUseCase: GetActiveShiftUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(
    @Body(RegisterSiteRequestPipe) body: RegisterSiteRequestDto,
  ): Promise<SiteResult> {
    return this.registerSiteUseCase.execute({
      name: body.name,
      address: body.address,
      timeZone: body.timeZone,
      buildingType: body.buildingType,
    });
  }

  @Get()
  list(): Promise<SiteResult[]> {
    return this.listSitesUseCase.execute();
  }

  @Get(':siteId/assets')
  listBySite(@Param('siteId') siteId: string): Promise<AssetResult[]> {
    return this.listAssetsBySiteUseCase.execute({ siteId });
  }

  @Post(':siteId/shifts/start')
  @HttpCode(HttpStatus.CREATED)
  async startShift(
    @Param('siteId') siteId: string,
    @Body(StartShiftRequestPipe) body: StartShiftRequestDto,
  ): Promise<ShiftResult> {
    try {
      return await this.startShiftUseCase.execute({
        siteId,
        operatorId: body.operatorId,
        shiftType: body.shiftType,
      });
    } catch (error) {
      if (error instanceof ActiveShiftAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Get(':siteId/shifts/active')
  async getActiveShift(
    @Param('siteId') siteId: string,
  ): Promise<ShiftResult> {
    try {
      const shift = await this.getActiveShiftUseCase.execute({ siteId });

      if (shift === null) {
        throw new NotFoundException('No active shift was found for this site.');
      }

      return shift;
    } catch (error) {
      if (error instanceof MultipleActiveShiftsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Get(':id')
  getById(@Param('id') siteId: string): Promise<SiteResult> {
    return this.getSiteByIdUseCase.execute({ siteId }).then((site) => {
      if (site === null) {
        throw new NotFoundException('Site was not found.');
      }

      return site;
    });
  }
}
