import { getSchemaPath } from '@nestjs/swagger';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';
import {
  OperationObject,
  ParameterObject,
  RequestBodyObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { AssignIncidentRequestDto } from '../../../operations/infrastructure/http/assign-incident.dto';
import { CreateWorkOrderFromIncidentRequestDto } from '../../../operations/infrastructure/http/create-work-order-from-incident.dto';
import { CreateWorkOrderRequestDto } from '../../../operations/infrastructure/http/create-work-order.dto';
import { DetectIncidentRequestDto } from '../../../operations/infrastructure/http/detect-incident.dto';
import { CreateNotificationRequestDto } from '../../../operations/infrastructure/http/notification.dto';
import { RegisterActorRequestDto } from '../../../operations/infrastructure/http/register-actor.dto';
import { RegisterAssetRequestDto } from '../../../operations/infrastructure/http/register-asset.dto';
import { RegisterSiteRequestDto } from '../../../operations/infrastructure/http/register-site.dto';
import { StartShiftRequestDto } from '../../../operations/infrastructure/http/start-shift.dto';
import { CreateUserRequestDto } from '../../../authentication/infrastructure/http/create-user.dto';
import { ProblemDetailsSchema } from './problem-details.schema';
import {
  CURRENT_USER_AUTH_DESCRIPTION,
  SECURITY_SCHEME_BEARER,
} from './swagger.constants';

type HttpMethod = 'get' | 'post';

type EndpointDocumentation = {
  path: string;
  method: HttpMethod;
  tags: string[];
  summary: string;
  description?: string;
  requestBodyDto?: new () => object;
  multipart?: boolean;
  queryParameters?: Array<{
    name: string;
    required?: boolean;
    schema: Record<string, unknown>;
  }>;
  successStatus: '200' | '201';
  successDescription: string;
  security?: Array<Record<string, string[]>>;
};

const PROBLEM_DETAILS_REF = { $ref: getSchemaPath(ProblemDetailsSchema) };

const PROBLEM_DETAILS_CONTENT = {
  'application/problem+json': {
    schema: PROBLEM_DETAILS_REF,
  },
};

const STANDARD_ERROR_RESPONSES = {
  '400': {
    description: 'Bad Request (RFC 9457 Problem Details).',
    content: PROBLEM_DETAILS_CONTENT,
  },
  '404': {
    description: 'Not Found (RFC 9457 Problem Details).',
    content: PROBLEM_DETAILS_CONTENT,
  },
  '409': {
    description: 'Conflict (RFC 9457 Problem Details).',
    content: PROBLEM_DETAILS_CONTENT,
  },
  '500': {
    description: 'Internal Server Error (RFC 9457 Problem Details).',
    content: PROBLEM_DETAILS_CONTENT,
  },
};

const ENDPOINTS: EndpointDocumentation[] = [
  {
    path: '/api/v1/health',
    method: 'get',
    tags: ['System', 'Health'],
    summary: 'Health check',
    successStatus: '200',
    successDescription: 'Service health status.',
  },
  {
    path: '/api/v1/info',
    method: 'get',
    tags: ['System', 'Info'],
    summary: 'API metadata',
    successStatus: '200',
    successDescription: 'API name, version and architecture metadata.',
  },
  {
    path: '/api/v1/authentication/users',
    method: 'post',
    tags: ['Authentication'],
    summary: 'Create user',
    requestBodyDto: CreateUserRequestDto,
    successStatus: '201',
    successDescription: 'User created.',
    security: [],
  },
  {
    path: '/api/v1/authentication/users/{id}',
    method: 'get',
    tags: ['Authentication'],
    summary: 'Get user by id',
    successStatus: '200',
    successDescription: 'Authenticated user view.',
    security: [],
  },
  {
    path: '/api/v1/authentication/me',
    method: 'get',
    tags: ['Authentication'],
    summary: 'Get current user',
    description: CURRENT_USER_AUTH_DESCRIPTION,
    successStatus: '200',
    successDescription: 'Current authenticated user.',
    security: [{ [SECURITY_SCHEME_BEARER]: [] }],
  },
  {
    path: '/api/v1/operations/assets',
    method: 'post',
    tags: ['Operations', 'Assets'],
    summary: 'Register asset',
    requestBodyDto: RegisterAssetRequestDto,
    successStatus: '201',
    successDescription: 'Asset registered.',
  },
  {
    path: '/api/v1/operations/assets/{id}',
    method: 'get',
    tags: ['Operations', 'Assets'],
    summary: 'Get asset by id',
    successStatus: '200',
    successDescription: 'Asset details.',
  },
  {
    path: '/api/v1/operations/sites',
    method: 'post',
    tags: ['Operations', 'Sites'],
    summary: 'Register site',
    requestBodyDto: RegisterSiteRequestDto,
    successStatus: '201',
    successDescription: 'Site registered.',
  },
  {
    path: '/api/v1/operations/sites',
    method: 'get',
    tags: ['Operations', 'Sites'],
    summary: 'List sites',
    successStatus: '200',
    successDescription: 'Registered sites.',
  },
  {
    path: '/api/v1/operations/sites/{id}',
    method: 'get',
    tags: ['Operations', 'Sites'],
    summary: 'Get site by id',
    successStatus: '200',
    successDescription: 'Site details.',
  },
  {
    path: '/api/v1/operations/sites/{siteId}/assets',
    method: 'get',
    tags: ['Operations', 'Sites', 'Assets'],
    summary: 'List assets by site',
    successStatus: '200',
    successDescription: 'Assets for the given site.',
  },
  {
    path: '/api/v1/operations/sites/{siteId}/actors',
    method: 'get',
    tags: ['Operations', 'Sites', 'Actors'],
    summary: 'List actors by site',
    successStatus: '200',
    successDescription: 'Actors for the given site.',
  },
  {
    path: '/api/v1/operations/sites/{siteId}/shifts/start',
    method: 'post',
    tags: ['Operations', 'Sites', 'Shifts'],
    summary: 'Start shift',
    requestBodyDto: StartShiftRequestDto,
    successStatus: '201',
    successDescription: 'Shift started.',
  },
  {
    path: '/api/v1/operations/sites/{siteId}/shifts/active',
    method: 'get',
    tags: ['Operations', 'Sites', 'Shifts'],
    summary: 'Get active shift',
    successStatus: '200',
    successDescription: 'Active shift for the site.',
  },
  {
    path: '/api/v1/operations/actors',
    method: 'post',
    tags: ['Operations', 'Actors'],
    summary: 'Register actor',
    requestBodyDto: RegisterActorRequestDto,
    successStatus: '201',
    successDescription: 'Actor registered.',
  },
  {
    path: '/api/v1/operations/actors/{id}',
    method: 'get',
    tags: ['Operations', 'Actors'],
    summary: 'Get actor by id',
    successStatus: '200',
    successDescription: 'Actor details.',
  },
  {
    path: '/api/v1/operations/shifts/{shiftId}/close',
    method: 'post',
    tags: ['Operations', 'Shifts'],
    summary: 'Close shift',
    successStatus: '200',
    successDescription: 'Shift closed.',
  },
  {
    path: '/api/v1/operations/incidents',
    method: 'post',
    tags: ['Operations', 'Incidents'],
    summary: 'Detect incident',
    requestBodyDto: DetectIncidentRequestDto,
    successStatus: '201',
    successDescription: 'Incident detected.',
  },
  {
    path: '/api/v1/operations/incidents',
    method: 'get',
    tags: ['Operations', 'Incidents'],
    summary: 'List incidents',
    queryParameters: [
      {
        name: 'status',
        schema: {
          type: 'string',
          enum: ['DETECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
        },
      },
      { name: 'assetId', schema: { type: 'string', format: 'uuid' } },
      { name: 'shiftId', schema: { type: 'string', format: 'uuid' } },
      { name: 'actorId', schema: { type: 'string', format: 'uuid' } },
      { name: 'siteId', schema: { type: 'string', format: 'uuid' } },
    ],
    successStatus: '200',
    successDescription: 'Filtered incidents.',
  },
  {
    path: '/api/v1/operations/incidents/{id}',
    method: 'get',
    tags: ['Operations', 'Incidents'],
    summary: 'Get incident by id',
    successStatus: '200',
    successDescription: 'Incident details.',
  },
  {
    path: '/api/v1/operations/incidents/{id}/assign',
    method: 'post',
    tags: ['Operations', 'Incidents'],
    summary: 'Assign incident',
    requestBodyDto: AssignIncidentRequestDto,
    successStatus: '201',
    successDescription: 'Incident assigned.',
  },
  {
    path: '/api/v1/operations/incidents/{id}/start',
    method: 'post',
    tags: ['Operations', 'Incidents'],
    summary: 'Start incident',
    successStatus: '201',
    successDescription: 'Incident started.',
  },
  {
    path: '/api/v1/operations/incidents/{id}/resolve',
    method: 'post',
    tags: ['Operations', 'Incidents'],
    summary: 'Resolve incident',
    successStatus: '201',
    successDescription: 'Incident resolved.',
  },
  {
    path: '/api/v1/operations/incidents/{incidentId}/timeline',
    method: 'get',
    tags: ['Operations', 'Timeline'],
    summary: 'Get incident timeline',
    successStatus: '200',
    successDescription: 'Timeline entries for the incident.',
  },
  {
    path: '/api/v1/operations/incidents/{incidentId}/work-orders',
    method: 'post',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Create work order from incident',
    requestBodyDto: CreateWorkOrderFromIncidentRequestDto,
    successStatus: '201',
    successDescription: 'Work order created.',
  },
  {
    path: '/api/v1/operations/incidents/{incidentId}/work-orders',
    method: 'get',
    tags: ['Operations', 'WorkOrders'],
    summary: 'List work orders by incident',
    successStatus: '200',
    successDescription: 'Work orders for the incident.',
  },
  {
    path: '/api/v1/operations/work-orders',
    method: 'post',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Create work order',
    requestBodyDto: CreateWorkOrderRequestDto,
    successStatus: '201',
    successDescription: 'Work order created.',
  },
  {
    path: '/api/v1/operations/work-orders/{id}',
    method: 'get',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Get work order by id',
    successStatus: '200',
    successDescription: 'Work order details.',
  },
  {
    path: '/api/v1/operations/work-orders/{id}/start',
    method: 'post',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Start work order',
    successStatus: '200',
    successDescription: 'Work order started.',
  },
  {
    path: '/api/v1/operations/work-orders/{id}/complete',
    method: 'post',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Complete work order',
    successStatus: '200',
    successDescription: 'Work order completed.',
  },
  {
    path: '/api/v1/operations/work-orders/{id}/cancel',
    method: 'post',
    tags: ['Operations', 'WorkOrders'],
    summary: 'Cancel work order',
    successStatus: '200',
    successDescription: 'Work order cancelled.',
  },
  {
    path: '/api/v1/operations/notifications',
    method: 'post',
    tags: ['Operations', 'Notifications'],
    summary: 'Create notification',
    requestBodyDto: CreateNotificationRequestDto,
    successStatus: '201',
    successDescription: 'Notification created.',
  },
  {
    path: '/api/v1/operations/notifications/{id}',
    method: 'get',
    tags: ['Operations', 'Notifications'],
    summary: 'Get notification by id',
    successStatus: '200',
    successDescription: 'Notification details.',
  },
  {
    path: '/api/v1/operations/actors/{actorId}/notifications',
    method: 'get',
    tags: ['Operations', 'Notifications'],
    summary: 'List notifications by actor',
    successStatus: '200',
    successDescription: 'Notifications for the actor.',
  },
  {
    path: '/api/v1/operations/events/{eventId}/evidence',
    method: 'get',
    tags: ['Operations', 'Events'],
    summary: 'List evidence by event',
    successStatus: '200',
    successDescription: 'Evidence linked to the event.',
  },
  {
    path: '/api/v1/operations/events/{eventId}/evidence',
    method: 'post',
    tags: ['Operations', 'Events'],
    summary: 'Capture evidence',
    multipart: true,
    successStatus: '201',
    successDescription: 'Evidence captured.',
  },
  {
    path: '/api/v1/operations/dashboard',
    method: 'get',
    tags: ['Operations', 'Dashboard'],
    summary: 'Get operations dashboard',
    queryParameters: [
      {
        name: 'actorId',
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    successStatus: '200',
    successDescription: 'Operations dashboard snapshot.',
  },
];

function buildRequestBody(
  endpoint: EndpointDocumentation,
): RequestBodyObject | undefined {
  if (endpoint.multipart) {
    return {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['actorId', 'file'],
            properties: {
              actorId: { type: 'string', format: 'uuid' },
              caption: { type: 'string' },
              file: { type: 'string', format: 'binary' },
            },
          },
        },
      },
    };
  }

  if (endpoint.requestBodyDto === undefined) {
    return undefined;
  }

  return {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(endpoint.requestBodyDto) },
      },
    },
  };
}

function buildQueryParameters(
  endpoint: EndpointDocumentation,
): ParameterObject[] | undefined {
  if (endpoint.queryParameters === undefined) {
    return undefined;
  }

  return endpoint.queryParameters.map((parameter) => ({
    name: parameter.name,
    in: 'query',
    required: parameter.required ?? false,
    schema: parameter.schema,
  }));
}

export function enrichOpenApiDocument(document: OpenAPIObject): void {
  for (const endpoint of ENDPOINTS) {
    const pathItem = document.paths[endpoint.path];

    if (pathItem === undefined) {
      continue;
    }

    const operation = pathItem[endpoint.method] as OperationObject | undefined;

    if (operation === undefined) {
      continue;
    }

    operation.tags = endpoint.tags;
    operation.summary = endpoint.summary;
    operation.security = endpoint.security ?? [];

    if (endpoint.description !== undefined) {
      operation.description = endpoint.description;
    }

    const requestBody = buildRequestBody(endpoint);

    if (requestBody !== undefined) {
      operation.requestBody = requestBody;
    }

    const parameters = buildQueryParameters(endpoint);

    if (parameters !== undefined) {
      operation.parameters = parameters;
    }

    operation.responses = {
      [endpoint.successStatus]: {
        description: endpoint.successDescription,
      },
      ...STANDARD_ERROR_RESPONSES,
    };
  }
}
