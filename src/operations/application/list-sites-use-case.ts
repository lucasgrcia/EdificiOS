import { toSiteResult } from './map-site';
import { SiteRepository } from './site-persistence';
import { SiteResult } from './site-result';

export type ListSitesUseCaseDependencies = {
  siteRepository: SiteRepository;
};

export class ListSitesUseCase {
  constructor(
    private readonly dependencies: ListSitesUseCaseDependencies,
  ) {}

  async execute(): Promise<SiteResult[]> {
    const records = await this.dependencies.siteRepository.findAll();

    return records.map((record) => toSiteResult(record));
  }
}
