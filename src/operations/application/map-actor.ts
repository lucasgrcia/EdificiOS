import { ActorAggregate } from '../domain/actor/actor';
import { ActorRecord } from './actor-persistence';
import { ActorResult } from './actor-result';

export function toActorRecord(
  actor: ActorAggregate,
  siteId: string,
): ActorRecord {
  return {
    id: actor.id,
    siteId,
    name: actor.name,
    role: actor.role,
    status: actor.status,
  };
}

export function toActorResult(record: ActorRecord): ActorResult {
  const actor = ActorAggregate.rehydrate({
    actorId: record.id,
    name: record.name,
    role: record.role,
    status: record.status,
  });

  return {
    id: actor.id,
    siteId: record.siteId,
    name: actor.name,
    role: actor.role,
    status: actor.status,
  };
}
