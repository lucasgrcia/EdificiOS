import { Address } from './value-objects/address';
import { BuildingType } from './value-objects/building-type';
import { SiteId } from './value-objects/site-id';
import { SiteName } from './value-objects/site-name';
import { TimeZone } from './value-objects/time-zone';

export type RegisterSiteInput = {
  siteId: string;
  name: string;
  address: string;
  timeZone: string;
  buildingType: string;
};

export type RehydrateSiteInput = {
  siteId: string;
  name: string;
  address: string;
  timeZone: string;
  buildingType: string;
};

export class SiteAggregate {
  private constructor(
    private readonly siteIdentifier: SiteId,
    private readonly siteName: SiteName,
    private readonly siteAddress: Address,
    private readonly siteTimeZone: TimeZone,
    private readonly siteBuildingType: BuildingType,
  ) {}

  static register(input: RegisterSiteInput): SiteAggregate {
    if (input.siteId.trim().length === 0) {
      throw new Error('Site id is required.');
    }

    return new SiteAggregate(
      SiteId.create(input.siteId),
      SiteName.create(input.name),
      Address.create(input.address),
      TimeZone.create(input.timeZone),
      BuildingType.create(input.buildingType),
    );
  }

  static rehydrate(input: RehydrateSiteInput): SiteAggregate {
    if (input.siteId.trim().length === 0) {
      throw new Error('Site id is required.');
    }

    return new SiteAggregate(
      SiteId.create(input.siteId),
      SiteName.create(input.name),
      Address.create(input.address),
      TimeZone.create(input.timeZone),
      BuildingType.create(input.buildingType),
    );
  }

  get id(): string {
    return this.siteIdentifier.toString();
  }

  get name(): string {
    return this.siteName.toString();
  }

  get address(): string {
    return this.siteAddress.toString();
  }

  get timeZone(): string {
    return this.siteTimeZone.toString();
  }

  get buildingType(): string {
    return this.siteBuildingType.toString();
  }
}
