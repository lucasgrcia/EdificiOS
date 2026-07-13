export class ApplicationConfig {
  readonly name = 'EdificiOS API';

  readonly version = '0.15.0-alpha';

  readonly environment = 'development';

  readonly apiPrefix = '/api/v1';

  readonly swaggerPath = '/api/docs';
}

export function resolveSwaggerRoutePath(swaggerPath: string): string {
  return swaggerPath.startsWith('/') ? swaggerPath.slice(1) : swaggerPath;
}
