import { ActorId } from '../src/operations/domain/evidence/value-objects/actor-id';
import { CapturedAt } from '../src/operations/domain/evidence/value-objects/captured-at';
import { EvidenceCaption } from '../src/operations/domain/evidence/value-objects/evidence-caption';
import { EvidenceId } from '../src/operations/domain/evidence/value-objects/evidence-id';
import { MimeType } from '../src/operations/domain/evidence/value-objects/mime-type';
import { StorageReference } from '../src/operations/domain/evidence/value-objects/storage-reference';
import { Evidence } from '../src/operations/domain/evidence/evidence';

describe('Evidence value objects', () => {
  describe('EvidenceId', () => {
    it('creates a valid evidence id', () => {
      const evidenceId = EvidenceId.create(' evidence-1 ');

      expect(evidenceId.toString()).toBe('evidence-1');
    });

    it('rejects an empty evidence id', () => {
      expect(() => EvidenceId.create('   ')).toThrow('Evidence id is required.');
    });
  });

  describe('ActorId', () => {
    it('creates a valid actor id', () => {
      const actorId = ActorId.create(' actor-1 ');

      expect(actorId.toString()).toBe('actor-1');
    });

    it('rejects an empty actor id', () => {
      expect(() => ActorId.create('  ')).toThrow('Actor id is required.');
    });
  });

  describe('StorageReference', () => {
    it('creates a valid storage reference', () => {
      const storageReference = StorageReference.create(
        ' 2026/07/bomba-principal.jpg ',
      );

      expect(storageReference.toString()).toBe('2026/07/bomba-principal.jpg');
    });

    it('normalizes path separators', () => {
      const storageReference = StorageReference.create(
        '2026\\07\\bomba-principal.jpg',
      );

      expect(storageReference.toString()).toBe('2026/07/bomba-principal.jpg');
    });

    it('rejects an empty storage reference', () => {
      expect(() => StorageReference.create('')).toThrow(
        'Storage reference is required.',
      );
    });

    it('rejects an absolute storage reference', () => {
      expect(() => StorageReference.create('/etc/passwd')).toThrow(
        'Storage reference must be a relative path.',
      );
    });

    it('rejects a parent traversal storage reference', () => {
      expect(() => StorageReference.create('../secrets/key')).toThrow(
        'Storage reference must be a relative path.',
      );
    });
  });

  describe('MimeType', () => {
    it.each([
      'image/jpeg',
      'image/png',
      'video/mp4',
      'audio/mpeg',
    ])('accepts supported mime type %s', (mimeType) => {
      expect(MimeType.create(mimeType).toString()).toBe(mimeType);
    });

    it('normalizes mime type casing', () => {
      expect(MimeType.create(' IMAGE/JPEG ').toString()).toBe('image/jpeg');
    });

    it('rejects unsupported mime types', () => {
      expect(() => MimeType.create('application/pdf')).toThrow(
        'Mime type is not supported.',
      );
    });
  });

  describe('EvidenceCaption', () => {
    it('creates a valid caption', () => {
      const caption = EvidenceCaption.create(' Olor a quemado en bomba principal. ');

      expect(caption.toString()).toBe('Olor a quemado en bomba principal.');
    });

    it('rejects an empty caption', () => {
      expect(() => EvidenceCaption.create('   ')).toThrow(
        'Evidence caption cannot be empty.',
      );
    });
  });

  describe('CapturedAt', () => {
    it('creates a valid captured at timestamp', () => {
      const capturedAt = CapturedAt.create(
        new Date('2026-07-07T10:00:00.000Z'),
        new Date('2026-07-07T10:05:00.000Z'),
      );

      expect(capturedAt.toDate()).toEqual(new Date('2026-07-07T10:00:00.000Z'));
    });

    it('rejects an invalid captured at timestamp', () => {
      expect(() => CapturedAt.create(new Date('invalid'))).toThrow(
        'Captured at is required.',
      );
    });

    it('rejects a captured at timestamp in the future', () => {
      expect(() =>
        CapturedAt.create(
          new Date('2026-07-07T11:00:00.000Z'),
          new Date('2026-07-07T10:00:00.000Z'),
        ),
      ).toThrow('Captured at cannot be in the future.');
    });
  });
});

describe('Evidence entity', () => {
  const capturedAt = new Date('2026-07-07T10:00:00.000Z');

  it('captures independent physical proof with optional caption', () => {
    const evidence = Evidence.capture({
      evidenceId: 'evidence-1',
      actorId: 'actor-1',
      storageReference: '2026/07/bomba-principal.jpg',
      caption: 'Olor a quemado en bomba principal.',
      capturedAt,
    });

    expect(evidence.id).toBe('evidence-1');
    expect(evidence.actorId).toBe('actor-1');
    expect(evidence.storageReference.toString()).toBe(
      '2026/07/bomba-principal.jpg',
    );
    expect(evidence.caption).toBe('Olor a quemado en bomba principal.');
    expect(evidence.capturedAt).toEqual(capturedAt);
  });

  it('captures evidence without caption', () => {
    const evidence = Evidence.capture({
      evidenceId: 'evidence-1',
      actorId: 'actor-1',
      storageReference: '2026/07/recorrida-subsuelo.jpg',
      capturedAt,
    });

    expect(evidence.caption).toBeNull();
  });

  it('requires physical proof through storage reference', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: 'actor-1',
        storageReference: '   ',
        capturedAt,
      }),
    ).toThrow('Storage reference is required.');
  });

  it('requires the actor who captured the evidence', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: '',
        storageReference: '2026/07/bomba-principal.jpg',
        capturedAt,
      }),
    ).toThrow('Actor id is required.');
  });

  it('rejects evidence captured in the future', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: 'actor-1',
        storageReference: '2026/07/bomba-principal.jpg',
        capturedAt: new Date('2026-07-07T11:00:00.000Z'),
        asOf: new Date('2026-07-07T10:00:00.000Z'),
      }),
    ).toThrow('Captured at cannot be in the future.');
  });

  it('rejects an empty caption when provided', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: 'actor-1',
        storageReference: '2026/07/bomba-principal.jpg',
        caption: '   ',
        capturedAt,
      }),
    ).toThrow('Evidence caption cannot be empty.');
  });
});
