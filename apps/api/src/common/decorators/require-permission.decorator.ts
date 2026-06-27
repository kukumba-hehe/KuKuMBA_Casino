import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../../modules/permissions/permissions.registry';

export const PERMISSION_KEY = 'required_permission';

/** Gate a route behind a specific capability (enforced by PermissionsGuard). */
export const RequirePermission = (permission: PermissionKey) => SetMetadata(PERMISSION_KEY, permission);
