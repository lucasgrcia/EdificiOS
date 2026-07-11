import { ApiInfoView } from './api-info-view';

const API_NAME = 'EdificiOS Operations API';
const API_VERSION = '0.13.0-alpha';
const API_ENVIRONMENT = 'development';
const API_BOUNDED_CONTEXT = 'operations';
const API_ARCHITECTURE = [
  'DDD',
  'Clean Architecture',
  'CQRS (Light)',
  'Event Sourcing',
] as const;

export class GetApiInfoUseCase {
  execute(): ApiInfoView {
    return {
      name: API_NAME,
      version: API_VERSION,
      environment: API_ENVIRONMENT,
      boundedContext: API_BOUNDED_CONTEXT,
      architecture: [...API_ARCHITECTURE],
    };
  }
}
