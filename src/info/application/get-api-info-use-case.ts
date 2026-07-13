import { ApiInfoView } from './api-info-view';
import { ApplicationConfig } from '../../config/application-config';

const API_BOUNDED_CONTEXT = 'operations';
const API_ARCHITECTURE = [
  'DDD',
  'Clean Architecture',
  'CQRS (Light)',
  'Event Sourcing',
] as const;

export class GetApiInfoUseCase {
  constructor(private readonly applicationConfig: ApplicationConfig) {}

  execute(): ApiInfoView {
    return {
      name: this.applicationConfig.name,
      version: this.applicationConfig.version,
      environment: this.applicationConfig.environment,
      boundedContext: API_BOUNDED_CONTEXT,
      architecture: [...API_ARCHITECTURE],
    };
  }
}
