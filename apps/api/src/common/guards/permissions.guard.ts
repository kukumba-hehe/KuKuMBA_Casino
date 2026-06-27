import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionKey } from '../../modules/permissions/permissions.registry';
import { PermissionsService } from '../../modules/permissions/permissions.service';

/**
 * Enforces @RequirePermission(...). Routes without the decorator are untouched
 * (composes with the existing JWT/Roles guards). ADMIN passes everything.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role === UserRole.ADMIN) return true;
    if (!(await this.permissions.has(user.role, required))) {
      throw new ForbiddenException('PERMISSION_DENIED');
    }
    return true;
  }
}
