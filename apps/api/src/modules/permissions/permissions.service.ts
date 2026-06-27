import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  MANAGED_ROLES,
  PERMISSION_KEYS,
  PERMISSIONS,
  PermissionKey,
} from './permissions.registry';

const CACHE_TTL_MS = 15_000;

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  private cache: Map<UserRole, Set<string>> | null = null;
  private loadedAt = 0;

  private async load(): Promise<Map<UserRole, Set<string>>> {
    if (this.cache && Date.now() - this.loadedAt < CACHE_TTL_MS) return this.cache;
    const rows = await this.prisma.rolePermission.findMany();
    const map = new Map<UserRole, Set<string>>();
    for (const r of rows) {
      if (!r.allowed) continue;
      if (!map.has(r.role)) map.set(r.role, new Set());
      map.get(r.role)!.add(r.permission);
    }
    this.cache = map;
    this.loadedAt = Date.now();
    return map;
  }

  private invalidate() {
    this.cache = null;
    this.loadedAt = 0;
  }

  /** ADMIN always passes. Other roles must have an explicit allowed grant. */
  async has(role: UserRole, permission: PermissionKey): Promise<boolean> {
    if (role === UserRole.ADMIN) return true;
    const map = await this.load();
    return map.get(role)?.has(permission) ?? false;
  }

  /** The set of permission keys an operator may use (ADMIN ⇒ everything). */
  async allowedFor(role: UserRole): Promise<PermissionKey[]> {
    if (role === UserRole.ADMIN) return [...PERMISSION_KEYS];
    const map = await this.load();
    const set = map.get(role) ?? new Set<string>();
    return PERMISSION_KEYS.filter((k) => set.has(k));
  }

  /** Full editable matrix for the admin UI (managed roles × permissions). */
  async matrix() {
    const map = await this.load();
    const roles = MANAGED_ROLES.map((role) => ({
      role,
      permissions: Object.fromEntries(
        PERMISSION_KEYS.map((k) => [k, map.get(role)?.has(k) ?? false]),
      ),
    }));
    return { registry: PERMISSIONS, managedRoles: MANAGED_ROLES, roles };
  }

  async setPermission(role: UserRole, permission: string, allowed: boolean) {
    if (role === UserRole.ADMIN) throw new BadRequestException('ADMIN_ROLE_IS_IMMUTABLE');
    if (!MANAGED_ROLES.includes(role)) throw new BadRequestException('ROLE_NOT_MANAGED');
    if (!PERMISSION_KEYS.includes(permission as PermissionKey)) throw new BadRequestException('UNKNOWN_PERMISSION');
    await this.prisma.rolePermission.upsert({
      where: { role_permission: { role, permission } },
      create: { role, permission, allowed },
      update: { allowed },
    });
    this.invalidate();
    return { ok: true };
  }
}
