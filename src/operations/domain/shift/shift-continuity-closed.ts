import { DomainEvent } from '../domain-event';

export const SHIFT_CONTINUITY_CLOSED_EVENT_NAME = 'shift.continuity.closed';

export class ShiftContinuityClosed implements DomainEvent {
  readonly name = SHIFT_CONTINUITY_CLOSED_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly shiftId: string,
    readonly endedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.endedAt);
  }
}
