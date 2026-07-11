import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';

import { GetIncidentByIdUseCase } from '../../application/get-incident-by-id-use-case';
import { GetIncidentTimelineUseCase } from '../../application/get-incident-timeline-use-case';
import { IncidentView } from '../../application/incident-view';
import { TimelineEntryView } from '../../application/incident-timeline';
import { ListIncidentsUseCase } from '../../application/list-incidents-use-case';
import { GetIncidentByIdParamsPipe } from './get-incident-by-id-params.pipe';
import { ListIncidentsQueryDto } from './list-incidents-query.dto';
import { ListIncidentsQueryPipe } from './list-incidents-query.pipe';

@Controller('api/v1/operations/incidents')
export class IncidentQueryController {
  constructor(
    private readonly listIncidentsUseCase: ListIncidentsUseCase,
    private readonly getIncidentByIdUseCase: GetIncidentByIdUseCase,
    private readonly getIncidentTimelineUseCase: GetIncidentTimelineUseCase,
  ) {}

  @Get()
  list(
    @Query(ListIncidentsQueryPipe) query: ListIncidentsQueryDto,
  ): Promise<IncidentView[]> {
    return this.listIncidentsUseCase.execute(query);
  }

  @Get(':incidentId/timeline')
  getTimeline(
    @Param('incidentId', GetIncidentByIdParamsPipe) incidentId: string,
  ): Promise<TimelineEntryView[]> {
    return this.getIncidentTimelineUseCase
      .execute({ incidentId })
      .then((timeline) => timeline.entries);
  }

  @Get(':id')
  getById(
    @Param('id', GetIncidentByIdParamsPipe) incidentId: string,
  ): Promise<IncidentView> {
    return this.getIncidentByIdUseCase.execute({ incidentId }).then((incident) => {
      if (incident === null) {
        throw new NotFoundException('Incident was not found.');
      }

      return incident;
    });
  }
}
