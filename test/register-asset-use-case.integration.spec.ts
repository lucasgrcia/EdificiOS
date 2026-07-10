import { SiteNotFoundError } from '../src/operations/domain/site/site-not-found';
import { AssetRecord } from '../src/operations/application/asset-persistence';
import { RegisterAssetUseCase } from '../src/operations/application/register-asset-use-case';
import { SiteRecord } from '../src/operations/application/site-persistence';

describe('RegisterAssetUseCase integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const site: SiteRecord = {
    id: siteId,
    name: 'Torre B',
    address: 'Av. Corrientes 1234, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residencial',
  };
  const command = {
    siteId,
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: 'Grundfos',
    model: 'CR 32-4',
    serialNumber: 'SN-12345',
    location: 'Subsuelo',
    criticality: 'HIGH',
  };

  function createRepositories(options?: { siteExists?: boolean }) {
    const assets = new Map<string, AssetRecord>();

    const assetRepository = {
      save: jest.fn(async (record: AssetRecord) => {
        assets.set(record.id, structuredClone(record));
      }),
      findById: jest.fn(),
      findBySite: jest.fn(),
      assets,
    };

    const siteRepository = {
      save: jest.fn(),
      findById: jest.fn(async (id: string) => {
        if (options?.siteExists === false) {
          return null;
        }

        return id === siteId ? structuredClone(site) : null;
      }),
      findAll: jest.fn(),
    };

    return { assetRepository, siteRepository };
  }

  function createUseCase(
    repositories: ReturnType<typeof createRepositories>,
    assetId = '00000000-0000-0000-0000-000000000001',
  ) {
    return new RegisterAssetUseCase({
      assetRepository: repositories.assetRepository,
      siteRepository: repositories.siteRepository,
      idGenerator: {
        generate: () => assetId,
      },
    });
  }

  it('registers an asset when the site exists', async () => {
    const repositories = createRepositories();
    const useCase = createUseCase(repositories);

    const result = await useCase.execute(command);

    expect(result).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      siteId,
      name: 'Bomba principal',
      type: 'Bomba',
      manufacturer: 'Grundfos',
      model: 'CR 32-4',
      serialNumber: 'SN-12345',
      location: 'Subsuelo',
      criticality: 'HIGH',
    });
    expect(repositories.siteRepository.findById).toHaveBeenCalledWith(siteId);
    expect(repositories.assetRepository.save).toHaveBeenCalledTimes(1);
    expect(repositories.assetRepository.save).toHaveBeenCalledWith({
      id: '00000000-0000-0000-0000-000000000001',
      siteId,
      name: 'Bomba principal',
      type: 'Bomba',
      manufacturer: 'Grundfos',
      model: 'CR 32-4',
      serialNumber: 'SN-12345',
      location: 'Subsuelo',
      criticality: 'HIGH',
    });
  });

  it('rejects registration when the site does not exist', async () => {
    const repositories = createRepositories({ siteExists: false });
    const useCase = createUseCase(repositories);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      SiteNotFoundError,
    );

    expect(repositories.siteRepository.findById).toHaveBeenCalledWith(siteId);
    expect(repositories.assetRepository.save).not.toHaveBeenCalled();
  });
});
