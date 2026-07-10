import { SiteRepository } from './site-persistence';
import { SiteResult } from './site-result';
import { toSiteResult } from './map-site';

export type GetSiteByIdCommand = {
  siteId: string;
};

export type GetSiteByIdUseCaseDependencies = {
  siteRepository: SiteRepository;
};

export class GetSiteByIdUseCase {
  constructor(
    private readonly dependencies: GetSiteByIdUseCaseDependencies,
  ) {}

  async execute(command: GetSiteByIdCommand): Promise<SiteResult | null> {
    const record = await this.dependencies.siteRepository.findById(
      command.siteId,
    );

    if (record === null) {
      return null;
    }

    return toSiteResult(record);
  }
}
