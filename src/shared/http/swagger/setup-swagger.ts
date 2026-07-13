import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ApplicationConfig, resolveSwaggerRoutePath } from '../../../config/application-config';
import { CreateUserRequestDto } from '../../../authentication/infrastructure/http/create-user.dto';
import { AssignIncidentRequestDto } from '../../../operations/infrastructure/http/assign-incident.dto';
import { CreateWorkOrderFromIncidentRequestDto } from '../../../operations/infrastructure/http/create-work-order-from-incident.dto';
import { CreateWorkOrderRequestDto } from '../../../operations/infrastructure/http/create-work-order.dto';
import { DetectIncidentRequestDto } from '../../../operations/infrastructure/http/detect-incident.dto';
import { ListIncidentsQueryDto } from '../../../operations/infrastructure/http/list-incidents-query.dto';
import { CreateNotificationRequestDto } from '../../../operations/infrastructure/http/notification.dto';
import { RegisterActorRequestDto } from '../../../operations/infrastructure/http/register-actor.dto';
import { RegisterAssetRequestDto } from '../../../operations/infrastructure/http/register-asset.dto';
import { RegisterSiteRequestDto } from '../../../operations/infrastructure/http/register-site.dto';
import { StartShiftRequestDto } from '../../../operations/infrastructure/http/start-shift.dto';
import { enrichOpenApiDocument } from './openapi-enrichment';
import { ProblemDetailsSchema } from './problem-details.schema';
import { API_DESCRIPTION, BEARER_AUTH_DESCRIPTION, SECURITY_SCHEME_BEARER } from './swagger.constants';

const SWAGGER_MODELS = [
  ProblemDetailsSchema,
  CreateUserRequestDto,
  DetectIncidentRequestDto,
  AssignIncidentRequestDto,
  RegisterAssetRequestDto,
  RegisterSiteRequestDto,
  RegisterActorRequestDto,
  StartShiftRequestDto,
  CreateWorkOrderRequestDto,
  CreateWorkOrderFromIncidentRequestDto,
  CreateNotificationRequestDto,
  ListIncidentsQueryDto,
];

export function setupSwagger(app: INestApplication): void {
  const applicationConfig = app.get(ApplicationConfig);
  const swaggerRoutePath = resolveSwaggerRoutePath(applicationConfig.swaggerPath);

  const config = new DocumentBuilder()
    .setTitle(applicationConfig.name)
    .setDescription(API_DESCRIPTION)
    .setVersion(applicationConfig.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: BEARER_AUTH_DESCRIPTION,
      },
      SECURITY_SCHEME_BEARER,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: SWAGGER_MODELS,
  });

  enrichOpenApiDocument(document);

  SwaggerModule.setup(swaggerRoutePath, app, document, {
    jsonDocumentUrl: `${swaggerRoutePath}-json`,
  });
}
