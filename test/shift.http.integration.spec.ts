import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { CloseShiftUseCase } from '../src/operations/application/close-shift-use-case';
import { GetActiveShiftUseCase } from '../src/operations/application/get-active-shift-use-case';
import { ListAssetsBySiteUseCase } from '../src/operations/application/list-assets-by-site-use-case';
import { ShiftResult } from '../src/operations/application/shift-result';
import { StartShiftUseCase } from '../src/operations/application/start-shift-use-case';
import { ActiveShiftAlreadyExistsError } from '../src/operations/domain/shift/active-shift-already-exists';
import { ShiftNotFoundError } from '../src/operations/domain/shift/shift-not-found';
import { ShiftsController } from '../src/operations/infrastructure/http/shifts.controller';
import { SitesController } from '../src/operations/infrastructure/http/sites.controller';
import { StartShiftRequestPipe } from '../src/operations/infrastructure/http/start-shift-request.pipe';

describe('Shift HTTP integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const shiftId = '00000000-0000-0000-0000-000000000001';
  const operatorId = '00000000-0000-0000-0000-000000000020';
  const startedAt = new Date('2026-07-10T08:00:00.000Z');
  const endedAt = new Date('2026-07-10T16:00:00.000Z');
  const openShift: ShiftResult = {
    id: shiftId,
    siteId,
    operatorId,
    type: 'Mañana',
    status: 'OPEN',
    startedAt,
    endedAt: null,
  };
  const closedShift: ShiftResult = {
    ...openShift,
    status: 'CLOSED',
    endedAt,
  };

  let app: NestFastifyApplication;
  let startShiftUseCase: { execute: jest.Mock };
  let closeShiftUseCase: { execute: jest.Mock };
  let getActiveShiftUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    startShiftUseCase = {
      execute: jest.fn().mockResolvedValue(openShift),
    };
    closeShiftUseCase = {
      execute: jest.fn().mockResolvedValue(closedShift),
    };
    getActiveShiftUseCase = {
      execute: jest.fn().mockResolvedValue(openShift),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SitesController, ShiftsController],
      providers: [
        StartShiftRequestPipe,
        {
          provide: StartShiftUseCase,
          useValue: startShiftUseCase,
        },
        {
          provide: CloseShiftUseCase,
          useValue: closeShiftUseCase,
        },
        {
          provide: GetActiveShiftUseCase,
          useValue: getActiveShiftUseCase,
        },
        {
          provide: ListAssetsBySiteUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function serializeShift(shift: ShiftResult) {
    return {
      ...shift,
      startedAt: shift.startedAt.toISOString(),
      endedAt: shift.endedAt?.toISOString() ?? null,
    };
  }

  describe('POST /api/v1/operations/sites/:siteId/shifts/start', () => {
    it('returns 201 Created with the started shift', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/sites/${siteId}/shifts/start`,
        payload: {
          operatorId,
          shiftType: 'Mañana',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(serializeShift(openShift));
    });

    it('adapts request to StartShiftUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: `/api/v1/operations/sites/${siteId}/shifts/start`,
        payload: {
          operatorId: ` ${operatorId} `,
          shiftType: ' Mañana ',
        },
      });

      expect(startShiftUseCase.execute).toHaveBeenCalledWith({
        siteId,
        operatorId,
        shiftType: 'Mañana',
      });
    });

    it('returns 400 when operatorId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/sites/${siteId}/shifts/start`,
        payload: {
          shiftType: 'Mañana',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Operator id is required.');
      expect(startShiftUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 409 when site already has an active shift', async () => {
      startShiftUseCase.execute.mockRejectedValueOnce(
        new ActiveShiftAlreadyExistsError(siteId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/sites/${siteId}/shifts/start`,
        payload: {
          operatorId,
          shiftType: 'Mañana',
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().message).toBe(
        'An active shift already exists for this site.',
      );
    });
  });

  describe('POST /api/v1/operations/shifts/:shiftId/close', () => {
    it('returns 200 OK with the closed shift', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/shifts/${shiftId}/close`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeShift(closedShift));
      expect(closeShiftUseCase.execute).toHaveBeenCalledWith({ shiftId });
    });

    it('returns 404 when shift is not found', async () => {
      closeShiftUseCase.execute.mockRejectedValueOnce(
        new ShiftNotFoundError(shiftId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/shifts/${shiftId}/close`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Shift was not found.');
    });
  });

  describe('GET /api/v1/operations/sites/:siteId/shifts/active', () => {
    it('returns 200 OK with the active shift', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/shifts/active`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeShift(openShift));
      expect(getActiveShiftUseCase.execute).toHaveBeenCalledWith({ siteId });
    });

    it('returns 404 when site has no active shift', async () => {
      getActiveShiftUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/shifts/active`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe(
        'No active shift was found for this site.',
      );
    });
  });
});
