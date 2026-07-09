import { ActorId } from '../src/operations/domain/evidence/value-objects/actor-id';
import { CapturedAt } from '../src/operations/domain/evidence/value-objects/captured-at';
import { EvidenceCaption } from '../src/operations/domain/evidence/value-objects/evidence-caption';
import { EvidenceId } from '../src/operations/domain/evidence/value-objects/evidence-id';
import { MediaReference } from '../src/operations/domain/evidence/value-objects/media-reference';
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

  describe('MediaReference', () => {
    it('creates a valid media reference', () => {
      const mediaReference = MediaReference.create(
        ' media://photos/bomba-principal.jpg ',
      );

      expect(mediaReference.toString()).toBe('media://photos/bomba-principal.jpg');
    });

    it('rejects an empty media reference', () => {
      expect(() => MediaReference.create('')).toThrow(
        'Media reference is required.',
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
      mediaReference: 'media://photos/bomba-principal.jpg',
      caption: 'Olor a quemado en bomba principal.',
      capturedAt,
    });

    expect(evidence.id).toBe('evidence-1');
    expect(evidence.actorId).toBe('actor-1');
    expect(evidence.mediaReference).toBe('media://photos/bomba-principal.jpg');
    expect(evidence.caption).toBe('Olor a quemado en bomba principal.');
    expect(evidence.capturedAt).toEqual(capturedAt);
  });

  it('captures evidence without caption', () => {
    const evidence = Evidence.capture({
      evidenceId: 'evidence-1',
      actorId: 'actor-1',
      mediaReference: 'media://photos/recorrida-subsuelo.jpg',
      capturedAt,
    });

    expect(evidence.caption).toBeNull();
  });

  it('requires physical proof through media reference', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: 'actor-1',
        mediaReference: '   ',
        capturedAt,
      }),
    ).toThrow('Media reference is required.');
  });

  it('requires the actor who captured the evidence', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: '',
        mediaReference: 'media://photos/bomba-principal.jpg',
        capturedAt,
      }),
    ).toThrow('Actor id is required.');
  });

  it('rejects evidence captured in the future', () => {
    expect(() =>
      Evidence.capture({
        evidenceId: 'evidence-1',
        actorId: 'actor-1',
        mediaReference: 'media://photos/bomba-principal.jpg',
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
        mediaReference: 'media://photos/bomba-principal.jpg',
        caption: '   ',
        capturedAt,
      }),
    ).toThrow('Evidence caption cannot be empty.');
  });
});
