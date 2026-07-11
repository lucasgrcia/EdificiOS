import {
  IncidentTimelineRepository,
  IncidentTimelineView,
  TimelineEntryView,
} from './incident-timeline';
import {
  dedupeTimelineEntries,
  NOTIFICATION_TIMELINE_TYPE,
  sortTimelineEntries,
} from './map-incident-timeline';
import { NotificationQueryRepository } from './notification-query-persistence';

const TIMELINE_NOTIFICATION_LOOKUP_LIMIT = 100;

const INCIDENT_NOTIFICATION_TYPES = new Set([
  'INCIDENT_DETECTED',
  'INCIDENT_ASSIGNED',
  'INCIDENT_RESOLVED',
]);

export type GetIncidentTimelineCommand = {
  incidentId: string;
};

export type GetIncidentTimelineUseCaseDependencies = {
  incidentTimelineRepository: IncidentTimelineRepository;
  notificationQueryRepository: NotificationQueryRepository;
};

export class GetIncidentTimelineUseCase {
  constructor(
    private readonly dependencies: GetIncidentTimelineUseCaseDependencies,
  ) {}

  async execute(
    command: GetIncidentTimelineCommand,
  ): Promise<IncidentTimelineView> {
    const [timeline, recentNotifications] = await Promise.all([
      this.dependencies.incidentTimelineRepository.findTimelineByIncidentId(
        command.incidentId,
      ),
      this.dependencies.notificationQueryRepository.findRecent(
        TIMELINE_NOTIFICATION_LOOKUP_LIMIT,
      ),
    ]);

    const notificationEntries: TimelineEntryView[] = recentNotifications
      .filter((notification) =>
        INCIDENT_NOTIFICATION_TYPES.has(notification.type),
      )
      .map((notification) => ({
        timestamp: notification.createdAt,
        type: NOTIFICATION_TIMELINE_TYPE,
        description: notification.message,
        actorId: notification.recipientId,
      }));

    return {
      incidentId: timeline.incidentId,
      entries: dedupeTimelineEntries(
        sortTimelineEntries([...timeline.entries, ...notificationEntries]),
      ),
    };
  }
}
