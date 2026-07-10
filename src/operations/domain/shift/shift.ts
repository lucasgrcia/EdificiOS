import { ShiftContinuityClosed } from './shift-continuity-closed';
import { ShiftContinuityStarted } from './shift-continuity-started';
import { EndedAt } from './value-objects/ended-at';
import { OperatorId } from './value-objects/operator-id';
import { ShiftId } from './value-objects/shift-id';
import { ShiftStatus, ShiftStatusLevel } from './value-objects/shift-status';
import { ShiftType } from './value-objects/shift-type';
import { SiteId } from './value-objects/site-id';
import { StartedAt } from './value-objects/started-at';

export type ShiftDomainEvent = ShiftContinuityStarted | ShiftContinuityClosed;

export type StartShiftInput = {
  shiftId: string;
  flowId: string;
  siteId: string;
  operatorId: string;
  shiftType: string;
  startedAt: Date;
};

export type CloseShiftInput = {
  flowId: string;
  endedAt: Date;
};

export type RehydrateShiftInput = {
  shiftId: string;
  siteId: string;
  operatorId: string;
  shiftType: string;
  status: ShiftStatusLevel;
  startedAt: Date;
  endedAt: Date | null;
};

export class ShiftAggregate {
  private readonly domainEvents: ShiftDomainEvent[] = [];

  private constructor(
    private readonly shiftIdentifier: ShiftId,
    private readonly shiftSiteId: SiteId,
    private readonly shiftOperatorId: OperatorId,
    private readonly shiftTypeValue: ShiftType,
    private readonly shiftStartedAt: StartedAt,
    private status: ShiftStatus,
    private shiftEndedAt: EndedAt | null,
  ) {}

  static start(input: StartShiftInput): ShiftAggregate {
    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    const shift = new ShiftAggregate(
      ShiftId.create(input.shiftId),
      SiteId.create(input.siteId),
      OperatorId.create(input.operatorId),
      ShiftType.create(input.shiftType),
      StartedAt.create(input.startedAt),
      ShiftStatus.open(),
      null,
    );

    shift.recordContinuityStarted(input.flowId);

    return shift;
  }

  static rehydrate(input: RehydrateShiftInput): ShiftAggregate {
    const startedAt = StartedAt.create(input.startedAt);
    const status = ShiftStatus.create(input.status);

    if (status.isOpen() && input.endedAt !== null) {
      throw new Error('Open shift cannot have ended at.');
    }

    if (status.isClosed() && input.endedAt === null) {
      throw new Error('Closed shift requires ended at.');
    }

    return new ShiftAggregate(
      ShiftId.create(input.shiftId),
      SiteId.create(input.siteId),
      OperatorId.create(input.operatorId),
      ShiftType.create(input.shiftType),
      startedAt,
      status,
      input.endedAt === null ? null : EndedAt.create(input.endedAt, startedAt),
    );
  }

  static replay(events: readonly ShiftDomainEvent[]): ShiftAggregate {
    if (events.length === 0) {
      throw new Error('At least one domain event is required for replay.');
    }

    const [first, ...remainingEvents] = events;

    if (!(first instanceof ShiftContinuityStarted)) {
      throw new Error('Replay must begin with ShiftContinuityStarted.');
    }

    const shift = new ShiftAggregate(
      ShiftId.create(first.shiftId),
      SiteId.create(first.siteId),
      OperatorId.create(first.operatorId),
      ShiftType.create(first.shiftType),
      StartedAt.create(first.startedAt),
      ShiftStatus.open(),
      null,
    );

    for (const event of remainingEvents) {
      shift.applyHistoricalEvent(event);
    }

    return shift;
  }

  get id(): string {
    return this.shiftIdentifier.toString();
  }

  get siteId(): string {
    return this.shiftSiteId.toString();
  }

  get operatorId(): string {
    return this.shiftOperatorId.toString();
  }

  get shiftType(): string {
    return this.shiftTypeValue.toString();
  }

  get startedAt(): Date {
    return this.shiftStartedAt.toDate();
  }

  get endedAt(): Date | null {
    return this.shiftEndedAt?.toDate() ?? null;
  }

  get currentStatus(): ShiftStatusLevel {
    return this.status.toString() as ShiftStatusLevel;
  }

  close(input: CloseShiftInput): void {
    if (this.status.isClosed()) {
      throw new Error('Shift is already closed.');
    }

    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    this.status = ShiftStatus.closed();
    this.shiftEndedAt = EndedAt.create(input.endedAt, this.shiftStartedAt);
    this.recordContinuityClosed(input.flowId, this.shiftEndedAt);
  }

  pullDomainEvents(): ShiftDomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private recordContinuityStarted(flowId: string): void {
    this.domainEvents.push(
      new ShiftContinuityStarted(
        flowId,
        this.id,
        this.siteId,
        this.operatorId,
        this.shiftType,
        this.startedAt,
      ),
    );
  }

  private recordContinuityClosed(flowId: string, endedAt: EndedAt): void {
    this.domainEvents.push(
      new ShiftContinuityClosed(flowId, this.id, endedAt.toDate()),
    );
  }

  private applyHistoricalEvent(event: ShiftDomainEvent): void {
    if (event instanceof ShiftContinuityClosed) {
      if (this.status.isClosed()) {
        throw new Error(
          'Invalid replay sequence: closed event requires OPEN status.',
        );
      }

      this.status = ShiftStatus.closed();
      this.shiftEndedAt = EndedAt.create(event.endedAt, this.shiftStartedAt);
      return;
    }

    throw new Error('Unsupported shift domain event for replay.');
  }
}
