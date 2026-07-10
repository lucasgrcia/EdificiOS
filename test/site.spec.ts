import { SiteAggregate } from '../src/operations/domain/site/site';
import { Address } from '../src/operations/domain/site/value-objects/address';
import { BuildingType } from '../src/operations/domain/site/value-objects/building-type';
import { SiteId } from '../src/operations/domain/site/value-objects/site-id';
import { SiteName } from '../src/operations/domain/site/value-objects/site-name';
import { TimeZone } from '../src/operations/domain/site/value-objects/time-zone';

describe('Site value objects', () => {
  describe('SiteId', () => {
    it('creates a valid site id', () => {
      expect(SiteId.create(' site-1 ').toString()).toBe('site-1');
    });

    it('rejects an empty site id', () => {
      expect(() => SiteId.create('   ')).toThrow('Site id is required.');
    });
  });

  describe('SiteName', () => {
    it('creates a valid site name', () => {
      expect(SiteName.create(' Torre B ').toString()).toBe('Torre B');
    });

    it('rejects an empty site name', () => {
      expect(() => SiteName.create('')).toThrow('Site name is required.');
    });
  });

  describe('Address', () => {
    it('creates a valid address', () => {
      expect(
        Address.create(' Av. Corrientes 1234, CABA ').toString(),
      ).toBe('Av. Corrientes 1234, CABA');
    });

    it('rejects an empty address', () => {
      expect(() => Address.create('   ')).toThrow('Address is required.');
    });
  });

  describe('TimeZone', () => {
    it('creates a valid time zone', () => {
      expect(
        TimeZone.create(' America/Argentina/Buenos_Aires ').toString(),
      ).toBe('America/Argentina/Buenos_Aires');
    });

    it('rejects an empty time zone', () => {
      expect(() => TimeZone.create('')).toThrow('Time zone is required.');
    });
  });

  describe('BuildingType', () => {
    it('creates a valid building type', () => {
      expect(BuildingType.create(' Residencial ').toString()).toBe(
        'Residencial',
      );
    });

    it('rejects an empty building type', () => {
      expect(() => BuildingType.create('  ')).toThrow(
        'Building type is required.',
      );
    });
  });
});

describe('SiteAggregate', () => {
  const validInput = {
    siteId: 'site-1',
    name: 'Torre B',
    address: 'Av. Corrientes 1234, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residencial',
  };

  it('registers a valid site with all attributes', () => {
    const site = SiteAggregate.register(validInput);

    expect(site.id).toBe('site-1');
    expect(site.name).toBe('Torre B');
    expect(site.address).toBe('Av. Corrientes 1234, CABA');
    expect(site.timeZone).toBe('America/Argentina/Buenos_Aires');
    expect(site.buildingType).toBe('Residencial');
  });

  it('rehydrates a previously registered site', () => {
    const registered = SiteAggregate.register(validInput);
    const rehydrated = SiteAggregate.rehydrate({
      siteId: registered.id,
      name: registered.name,
      address: registered.address,
      timeZone: registered.timeZone,
      buildingType: registered.buildingType,
    });

    expect(rehydrated.id).toBe(registered.id);
    expect(rehydrated.name).toBe(registered.name);
    expect(rehydrated.address).toBe(registered.address);
    expect(rehydrated.timeZone).toBe(registered.timeZone);
    expect(rehydrated.buildingType).toBe(registered.buildingType);
  });

  it('rejects registration without site id', () => {
    expect(() =>
      SiteAggregate.register({
        ...validInput,
        siteId: '',
      }),
    ).toThrow('Site id is required.');
  });

  it('rejects registration without site name', () => {
    expect(() =>
      SiteAggregate.register({
        ...validInput,
        name: '   ',
      }),
    ).toThrow('Site name is required.');
  });

  it('rejects registration without address', () => {
    expect(() =>
      SiteAggregate.register({
        ...validInput,
        address: '',
      }),
    ).toThrow('Address is required.');
  });

  it('rejects registration without time zone', () => {
    expect(() =>
      SiteAggregate.register({
        ...validInput,
        timeZone: '  ',
      }),
    ).toThrow('Time zone is required.');
  });

  it('rejects registration without building type', () => {
    expect(() =>
      SiteAggregate.register({
        ...validInput,
        buildingType: '',
      }),
    ).toThrow('Building type is required.');
  });

  it('rejects rehydration without site id', () => {
    expect(() =>
      SiteAggregate.rehydrate({
        ...validInput,
        siteId: '',
      }),
    ).toThrow('Site id is required.');
  });
});
