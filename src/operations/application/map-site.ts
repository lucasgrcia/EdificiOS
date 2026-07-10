import { SiteAggregate } from '../domain/site/site';
import { SiteRecord } from './site-persistence';
import { SiteResult } from './site-result';

export function toSiteRecord(site: SiteAggregate): SiteRecord {
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    timeZone: site.timeZone,
    buildingType: site.buildingType,
  };
}

export function toSiteResult(record: SiteRecord): SiteResult {
  const site = SiteAggregate.rehydrate({
    siteId: record.id,
    name: record.name,
    address: record.address,
    timeZone: record.timeZone,
    buildingType: record.buildingType,
  });

  return {
    id: site.id,
    name: site.name,
    address: site.address,
    timeZone: site.timeZone,
    buildingType: site.buildingType,
  };
}
