export class ApplicationConfig {
  readonly name = 'EdificiOS API';

  readonly version = '0.18.0-alpha';

  readonly environment = 'development';

  readonly apiPrefix = '/api/v1';

  readonly swaggerPath = '/api/docs';

  readonly jwtSecret = 'edificios-dev-jwt-secret';

  readonly jwtIssuer = 'edificios-api';

  readonly jwtAudience = 'edificios-clients';

  readonly jwtExpiration = '1h';
}

export function resolveSwaggerRoutePath(swaggerPath: string): string {
  return swaggerPath.startsWith('/') ? swaggerPath.slice(1) : swaggerPath;
}
