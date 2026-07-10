import { ShiftAggregate } from '../domain/shift/shift';
import { ShiftStatusLevel } from '../domain/shift/value-objects/shift-status';
import { ShiftRecord } from './shift-persistence';
import { ShiftResult } from './shift-result';

export function toShiftRecord(shift: ShiftAggregate): ShiftRecord {
  return {
    id: shift.id,
    siteId: shift.siteId,
    actorId: shift.actorId,
    type: shift.shiftType,
    status: shift.currentStatus,
    startedAt: shift.startedAt,
    endedAt: shift.endedAt,
  };
}

export function rehydrateShift(record: ShiftRecord): ShiftAggregate {
  return ShiftAggregate.rehydrate({
    shiftId: record.id,
    siteId: record.siteId,
    actorId: record.actorId,
    shiftType: record.type,
    status: record.status as ShiftStatusLevel,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
  });
}

export function toShiftResult(record: ShiftRecord): ShiftResult {
  const shift = rehydrateShift(record);

  return {
    id: shift.id,
    siteId: shift.siteId,
    actorId: shift.actorId,
    type: shift.shiftType,
    status: shift.currentStatus,
    startedAt: shift.startedAt,
    endedAt: shift.endedAt,
  };
}
