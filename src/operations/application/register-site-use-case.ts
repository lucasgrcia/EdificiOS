import { SiteAggregate } from '../domain/site/site';
import { IdGenerator } from './incident-persistence';
import { toSiteRecord, toSiteResult } from './map-site';
import { SiteRepository } from './site-persistence';
import { SiteResult } from './site-result';

export type RegisterSiteCommand = {
  name: string;
  address: string;
  timeZone: string;
  buildingType: string;
};

export type RegisterSiteUseCaseDependencies = {
  siteRepository: SiteRepository;
  idGenerator: IdGenerator;
};

export class RegisterSiteUseCase {
  constructor(
    private readonly dependencies: RegisterSiteUseCaseDependencies,
  ) {}

  async execute(command: RegisterSiteCommand): Promise<SiteResult> {
    const siteId = this.dependencies.idGenerator.generate();
    const site = SiteAggregate.register({
      siteId,
      name: command.name,
      address: command.address,
      timeZone: command.timeZone,
      buildingType: command.buildingType,
    });

    const record = toSiteRecord(site);
    await this.dependencies.siteRepository.save(record);

    return toSiteResult(record);
  }
}
