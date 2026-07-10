import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { CancelWorkOrderUseCase } from '../src/operations/application/cancel-work-order-use-case';
import { CompleteWorkOrderUseCase } from '../src/operations/application/complete-work-order-use-case';
import { CreateWorkOrderFromIncidentUseCase } from '../src/operations/application/create-work-order-from-incident-use-case';
import { CreateWorkOrderUseCase } from '../src/operations/application/create-work-order-use-case';
import { GetWorkOrderByIdUseCase } from '../src/operations/application/get-work-order-by-id-use-case';
import { ListWorkOrdersByIncidentUseCase } from '../src/operations/application/list-work-orders-by-incident-use-case';
import { StartWorkOrderUseCase } from '../src/operations/application/start-work-order-use-case';
import { WorkOrderResult } from '../src/operations/application/work-order-result';
import { ActorNotFoundError } from '../src/operations/domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../src/operations/domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../src/operations/domain/work-order/open-work-order-already-exists';
import { WorkOrderNotFoundError } from '../src/operations/domain/work-order/work-order-not-found';
import { CreateWorkOrderRequestPipe } from '../src/operations/infrastructure/http/create-work-order-request.pipe';
import { CreateWorkOrderFromIncidentRequestPipe } from '../src/operations/infrastructure/http/create-work-order-from-incident-request.pipe';
import { GetWorkOrderByIdParamsPipe } from '../src/operations/infrastructure/http/get-work-order-by-id-params.pipe';
import { IncidentWorkOrdersController } from '../src/operations/infrastructure/http/incident-work-orders.controller';
import { ListWorkOrdersByIncidentParamsPipe } from '../src/operations/infrastructure/http/list-work-orders-by-incident-params.pipe';
import { WorkOrdersController } from '../src/operations/infrastructure/http/work-orders.controller';

describe('Work order HTTP integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000010';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const workOrderId = '00000000-0000-0000-0000-000000000001';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const openWorkOrder: WorkOrderResult = {
    id: workOrderId,
    incidentId,
    actorId,
    status: 'OPEN',
    description: 'Reparar bomba principal',
    createdAt,
  };
  const inProgressWorkOrder: WorkOrderResult = {
    ...openWorkOrder,
    status: 'IN_PROGRESS',
  };
  const completedWorkOrder: WorkOrderResult = {
    ...openWorkOrder,
    status: 'COMPLETED',
  };
  const cancelledWorkOrder: WorkOrderResult = {
    ...openWorkOrder,
    status: 'CANCELLED',
  };
  const secondWorkOrder: WorkOrderResult = {
    id: '00000000-0000-0000-0000-000000000002',
    incidentId,
    actorId,
    status: 'COMPLETED',
    description: 'Revisar válvula de retorno',
    createdAt: new Date('2026-07-10T10:00:00.000Z'),
  };

  let app: NestFastifyApplication;
  let createWorkOrderUseCase: { execute: jest.Mock };
  let getWorkOrderByIdUseCase: { execute: jest.Mock };
  let startWorkOrderUseCase: { execute: jest.Mock };
  let completeWorkOrderUseCase: { execute: jest.Mock };
  let cancelWorkOrderUseCase: { execute: jest.Mock };
  let listWorkOrdersByIncidentUseCase: { execute: jest.Mock };
  let createWorkOrderFromIncidentUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    createWorkOrderUseCase = {
      execute: jest.fn().mockResolvedValue(openWorkOrder),
    };
    getWorkOrderByIdUseCase = {
      execute: jest.fn().mockResolvedValue(openWorkOrder),
    };
    startWorkOrderUseCase = {
      execute: jest.fn().mockResolvedValue(inProgressWorkOrder),
    };
    completeWorkOrderUseCase = {
      execute: jest.fn().mockResolvedValue(completedWorkOrder),
    };
    cancelWorkOrderUseCase = {
      execute: jest.fn().mockResolvedValue(cancelledWorkOrder),
    };
    listWorkOrdersByIncidentUseCase = {
      execute: jest.fn().mockResolvedValue([openWorkOrder, secondWorkOrder]),
    };
    createWorkOrderFromIncidentUseCase = {
      execute: jest.fn().mockResolvedValue(openWorkOrder),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [WorkOrdersController, IncidentWorkOrdersController],
      providers: [
        CreateWorkOrderRequestPipe,
        CreateWorkOrderFromIncidentRequestPipe,
        GetWorkOrderByIdParamsPipe,
        ListWorkOrdersByIncidentParamsPipe,
        {
          provide: CreateWorkOrderUseCase,
          useValue: createWorkOrderUseCase,
        },
        {
          provide: GetWorkOrderByIdUseCase,
          useValue: getWorkOrderByIdUseCase,
        },
        {
          provide: StartWorkOrderUseCase,
          useValue: startWorkOrderUseCase,
        },
        {
          provide: CompleteWorkOrderUseCase,
          useValue: completeWorkOrderUseCase,
        },
        {
          provide: CancelWorkOrderUseCase,
          useValue: cancelWorkOrderUseCase,
        },
        {
          provide: ListWorkOrdersByIncidentUseCase,
          useValue: listWorkOrdersByIncidentUseCase,
        },
        {
          provide: CreateWorkOrderFromIncidentUseCase,
          useValue: createWorkOrderFromIncidentUseCase,
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

  function serializeWorkOrder(workOrder: WorkOrderResult) {
    return {
      ...workOrder,
      createdAt: workOrder.createdAt.toISOString(),
    };
  }

  describe('POST /api/v1/operations/work-orders', () => {
    it('returns 201 Created with the created work order', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId,
          actorId,
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(serializeWorkOrder(openWorkOrder));
    });

    it('adapts request body to CreateWorkOrderUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId: ` ${incidentId} `,
          actorId: ` ${actorId} `,
          description: ' Reparar bomba principal ',
        },
      });

      expect(createWorkOrderUseCase.execute).toHaveBeenCalledWith({
        incidentId,
        actorId,
        description: 'Reparar bomba principal',
      });
    });

    it('returns 400 when incidentId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          actorId,
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Incident id is required.');
      expect(createWorkOrderUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when description is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId,
          actorId,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(
        'Work order description is required.',
      );
      expect(createWorkOrderUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 404 when incident is not found', async () => {
      createWorkOrderUseCase.execute.mockRejectedValueOnce(
        new IncidentNotFoundError(incidentId),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId,
          actorId,
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Incident was not found.');
    });

    it('returns 404 when actor is not found', async () => {
      createWorkOrderUseCase.execute.mockRejectedValueOnce(
        new ActorNotFoundError(actorId),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId,
          actorId,
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Actor was not found.');
    });

    it('returns 409 when incident already has an open work order', async () => {
      createWorkOrderUseCase.execute.mockRejectedValueOnce(
        new OpenWorkOrderAlreadyExistsError(incidentId),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/work-orders',
        payload: {
          incidentId,
          actorId,
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().message).toBe(
        'An open work order already exists for this incident.',
      );
    });
  });

  describe('GET /api/v1/operations/work-orders/:id', () => {
    it('returns 200 OK with the work order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/work-orders/${workOrderId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeWorkOrder(openWorkOrder));
      expect(getWorkOrderByIdUseCase.execute).toHaveBeenCalledWith({
        workOrderId,
      });
    });

    it('returns 404 when work order is not found', async () => {
      getWorkOrderByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/work-orders/${workOrderId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Work order was not found.');
    });
  });

  describe('POST /api/v1/operations/work-orders/:id/start', () => {
    it('returns 200 OK with the started work order', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/start`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeWorkOrder(inProgressWorkOrder));
      expect(startWorkOrderUseCase.execute).toHaveBeenCalledWith({
        workOrderId,
      });
    });

    it('returns 404 when work order is not found', async () => {
      startWorkOrderUseCase.execute.mockRejectedValueOnce(
        new WorkOrderNotFoundError(workOrderId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/start`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Work order was not found.');
    });

    it('returns 400 when work order is not open', async () => {
      startWorkOrderUseCase.execute.mockRejectedValueOnce(
        new Error('Work order can only be started from OPEN status.'),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/start`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(
        'Work order can only be started from OPEN status.',
      );
    });
  });

  describe('POST /api/v1/operations/work-orders/:id/complete', () => {
    it('returns 200 OK with the completed work order', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/complete`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeWorkOrder(completedWorkOrder));
      expect(completeWorkOrderUseCase.execute).toHaveBeenCalledWith({
        workOrderId,
      });
    });

    it('returns 404 when work order is not found', async () => {
      completeWorkOrderUseCase.execute.mockRejectedValueOnce(
        new WorkOrderNotFoundError(workOrderId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/complete`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Work order was not found.');
    });

    it('returns 400 when work order is not in progress', async () => {
      completeWorkOrderUseCase.execute.mockRejectedValueOnce(
        new Error(
          'Work order can only be completed from IN_PROGRESS status.',
        ),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/complete`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(
        'Work order can only be completed from IN_PROGRESS status.',
      );
    });
  });

  describe('POST /api/v1/operations/work-orders/:id/cancel', () => {
    it('returns 200 OK with the cancelled work order', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/cancel`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(serializeWorkOrder(cancelledWorkOrder));
      expect(cancelWorkOrderUseCase.execute).toHaveBeenCalledWith({
        workOrderId,
      });
    });

    it('returns 404 when work order is not found', async () => {
      cancelWorkOrderUseCase.execute.mockRejectedValueOnce(
        new WorkOrderNotFoundError(workOrderId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/cancel`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Work order was not found.');
    });

    it('returns 400 when work order is already completed', async () => {
      cancelWorkOrderUseCase.execute.mockRejectedValueOnce(
        new Error('Completed work order cannot be cancelled.'),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/work-orders/${workOrderId}/cancel`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(
        'Completed work order cannot be cancelled.',
      );
    });
  });

  describe('GET /api/v1/operations/incidents/:incidentId/work-orders', () => {
    it('returns 200 OK with work orders for the incident', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        serializeWorkOrder(openWorkOrder),
        serializeWorkOrder(secondWorkOrder),
      ]);
      expect(listWorkOrdersByIncidentUseCase.execute).toHaveBeenCalledWith({
        incidentId,
      });
    });

    it('returns 200 OK with an empty list when incident has no work orders', async () => {
      listWorkOrdersByIncidentUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });

  describe('POST /api/v1/operations/incidents/:incidentId/work-orders', () => {
    it('returns 201 Created with the work order generated from the incident', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
        payload: {
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(serializeWorkOrder(openWorkOrder));
    });

    it('adapts request to CreateWorkOrderFromIncidentUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
        payload: {
          description: ' Reparar bomba principal ',
        },
      });

      expect(createWorkOrderFromIncidentUseCase.execute).toHaveBeenCalledWith({
        incidentId,
        description: 'Reparar bomba principal',
      });
    });

    it('returns 400 when description is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(
        'Work order description is required.',
      );
      expect(createWorkOrderFromIncidentUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 404 when incident is not found', async () => {
      createWorkOrderFromIncidentUseCase.execute.mockRejectedValueOnce(
        new IncidentNotFoundError(incidentId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
        payload: {
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Incident was not found.');
    });

    it('returns 409 when incident already has an open work order', async () => {
      createWorkOrderFromIncidentUseCase.execute.mockRejectedValueOnce(
        new OpenWorkOrderAlreadyExistsError(incidentId),
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/operations/incidents/${incidentId}/work-orders`,
        payload: {
          description: 'Reparar bomba principal',
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().message).toBe(
        'An open work order already exists for this incident.',
      );
    });
  });
});
