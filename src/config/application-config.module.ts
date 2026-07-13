import { Global, Module } from '@nestjs/common';

import { ApplicationConfig } from './application-config';

@Global()
@Module({
  providers: [ApplicationConfig],
  exports: [ApplicationConfig],
})
export class ApplicationConfigModule {}
