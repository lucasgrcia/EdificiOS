import { DomainEvent } from '../domain-event';

export const SHIFT_CONTINUITY_STARTED_EVENT_NAME = 'shift.continuity.started';

export class ShiftContinuityStarted implements DomainEvent {
  readonly name = SHIFT_CONTINUITY_STARTED_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly shiftId: string,
    readonly siteId: string,
    readonly operatorId: string,
    readonly shiftType: string,
    readonly startedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.startedAt);
  }
}
