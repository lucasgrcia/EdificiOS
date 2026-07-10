import { AssetAggregate } from '../src/operations/domain/asset/asset';
import { AssetId } from '../src/operations/domain/asset/value-objects/asset-id';
import { AssetName } from '../src/operations/domain/asset/value-objects/asset-name';
import { AssetType } from '../src/operations/domain/asset/value-objects/asset-type';
import { Criticality } from '../src/operations/domain/asset/value-objects/criticality';
import { Location } from '../src/operations/domain/asset/value-objects/location';
import { Manufacturer } from '../src/operations/domain/asset/value-objects/manufacturer';
import { Model } from '../src/operations/domain/asset/value-objects/model';
import { SerialNumber } from '../src/operations/domain/asset/value-objects/serial-number';

describe('Asset value objects', () => {
  describe('AssetId', () => {
    it('creates a valid asset id', () => {
      expect(AssetId.create(' asset-1 ').toString()).toBe('asset-1');
    });

    it('rejects an empty asset id', () => {
      expect(() => AssetId.create('   ')).toThrow('Asset id is required.');
    });
  });

  describe('AssetName', () => {
    it('creates a valid asset name', () => {
      expect(AssetName.create(' Bomba principal ').toString()).toBe(
        'Bomba principal',
      );
    });

    it('rejects an empty asset name', () => {
      expect(() => AssetName.create('')).toThrow('Asset name is required.');
    });
  });

  describe('AssetType', () => {
    it('creates a valid asset type', () => {
      expect(AssetType.create(' Bomba ').toString()).toBe('Bomba');
    });

    it('rejects an empty asset type', () => {
      expect(() => AssetType.create('  ')).toThrow('Asset type is required.');
    });
  });

  describe('Manufacturer', () => {
    it('creates a valid manufacturer', () => {
      expect(Manufacturer.create(' Grundfos ').toString()).toBe('Grundfos');
    });

    it('rejects an empty manufacturer', () => {
      expect(() => Manufacturer.create('   ')).toThrow(
        'Manufacturer cannot be empty.',
      );
    });
  });

  describe('Model', () => {
    it('creates a valid model', () => {
      expect(Model.create(' CR 32-4 ').toString()).toBe('CR 32-4');
    });

    it('rejects an empty model', () => {
      expect(() => Model.create('')).toThrow('Model cannot be empty.');
    });
  });

  describe('SerialNumber', () => {
    it('creates a valid serial number', () => {
      expect(SerialNumber.create(' SN-12345 ').toString()).toBe('SN-12345');
    });

    it('rejects an empty serial number', () => {
      expect(() => SerialNumber.create('   ')).toThrow(
        'Serial number cannot be empty.',
      );
    });
  });

  describe('Location', () => {
    it('creates a valid location', () => {
      expect(Location.create(' Subsuelo ').toString()).toBe('Subsuelo');
    });

    it('rejects an empty location', () => {
      expect(() => Location.create('')).toThrow('Location is required.');
    });
  });

  describe('Criticality', () => {
    it.each(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])(
      'accepts supported criticality %s',
      (criticality) => {
        expect(Criticality.create(criticality).toString()).toBe(criticality);
      },
    );

    it('normalizes criticality casing', () => {
      expect(Criticality.create(' high ').toString()).toBe('HIGH');
    });

    it('rejects unsupported criticality', () => {
      expect(() => Criticality.create('URGENT')).toThrow(
        'Criticality is not supported.',
      );
    });
  });
});

describe('AssetAggregate', () => {
  const validInput = {
    assetId: 'asset-1',
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: 'Grundfos',
    model: 'CR 32-4',
    serialNumber: 'SN-12345',
    location: 'Subsuelo',
    criticality: 'HIGH',
  };

  it('registers a valid asset with all attributes', () => {
    const asset = AssetAggregate.register(validInput);

    expect(asset.id).toBe('asset-1');
    expect(asset.name).toBe('Bomba principal');
    expect(asset.type).toBe('Bomba');
    expect(asset.manufacturer).toBe('Grundfos');
    expect(asset.model).toBe('CR 32-4');
    expect(asset.serialNumber).toBe('SN-12345');
    expect(asset.location).toBe('Subsuelo');
    expect(asset.criticality).toBe('HIGH');
  });

  it('registers a valid asset without optional equipment details', () => {
    const asset = AssetAggregate.register({
      assetId: 'asset-1',
      name: 'Bomba principal',
      type: 'Bomba',
      location: 'Subsuelo',
      criticality: 'CRITICAL',
    });

    expect(asset.manufacturer).toBeNull();
    expect(asset.model).toBeNull();
    expect(asset.serialNumber).toBeNull();
  });

  it('rehydrates a previously registered asset', () => {
    const registered = AssetAggregate.register(validInput);
    const rehydrated = AssetAggregate.rehydrate({
      assetId: registered.id,
      name: registered.name,
      type: registered.type,
      manufacturer: registered.manufacturer,
      model: registered.model,
      serialNumber: registered.serialNumber,
      location: registered.location,
      criticality: registered.criticality,
    });

    expect(rehydrated.id).toBe(registered.id);
    expect(rehydrated.name).toBe(registered.name);
    expect(rehydrated.type).toBe(registered.type);
    expect(rehydrated.manufacturer).toBe(registered.manufacturer);
    expect(rehydrated.model).toBe(registered.model);
    expect(rehydrated.serialNumber).toBe(registered.serialNumber);
    expect(rehydrated.location).toBe(registered.location);
    expect(rehydrated.criticality).toBe(registered.criticality);
  });

  it('rejects registration without asset id', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        assetId: '',
      }),
    ).toThrow('Asset id is required.');
  });

  it('rejects registration without asset name', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        name: '   ',
      }),
    ).toThrow('Asset name is required.');
  });

  it('rejects registration without asset type', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        type: '',
      }),
    ).toThrow('Asset type is required.');
  });

  it('rejects registration without location', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        location: '   ',
      }),
    ).toThrow('Location is required.');
  });

  it('rejects registration with unsupported criticality', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        criticality: 'URGENT',
      }),
    ).toThrow('Criticality is not supported.');
  });

  it('rejects registration with empty manufacturer when provided', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        manufacturer: '   ',
      }),
    ).toThrow('Manufacturer cannot be empty.');
  });

  it('rejects registration with empty model when provided', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        model: '   ',
      }),
    ).toThrow('Model cannot be empty.');
  });

  it('rejects registration with empty serial number when provided', () => {
    expect(() =>
      AssetAggregate.register({
        ...validInput,
        serialNumber: '   ',
      }),
    ).toThrow('Serial number cannot be empty.');
  });

  it('rejects rehydration without asset id', () => {
    expect(() =>
      AssetAggregate.rehydrate({
        ...validInput,
        assetId: '',
        manufacturer: validInput.manufacturer ?? null,
        model: validInput.model ?? null,
        serialNumber: validInput.serialNumber ?? null,
      }),
    ).toThrow('Asset id is required.');
  });
});
