import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

/** Global so the app-wide PermissionsGuard and any module can inject it. */
@Global()
@Module({
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
