import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ApplicationConfig, resolveSwaggerRoutePath } from '../../../config/application-config';
import { enrichOpenApiDocument } from './openapi-enrichment';
import { SWAGGER_EXTRA_MODELS } from './swagger-request-dtos';
import { API_DESCRIPTION, BEARER_AUTH_DESCRIPTION, SECURITY_SCHEME_BEARER } from './swagger.constants';

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
    extraModels: [...SWAGGER_EXTRA_MODELS],
  });

  enrichOpenApiDocument(document);

  SwaggerModule.setup(swaggerRoutePath, app, document, {
    jsonDocumentUrl: `${swaggerRoutePath}-json`,
  });
}
