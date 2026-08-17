import { ApiError } from '../utils/ApiError.js';
import * as permissionRepository from '../repositories/permission.repository.js';
import * as auditLogService from './auditLog.service.js';

export function listAllPermissions() {
  return permissionRepository.listAllPermissions();
}

export function listPermissionsForRole(roleName) {
  return permissionRepository.listPermissionsForRole(roleName);
}

export async function grantPermission({ roleName, key, actorId, actorRole }) {
  const result = await permissionRepository.grantPermission(roleName, key);
  if (!result) throw ApiError.notFound('Unknown role or permission key');

  await auditLogService.record({
    actorId,
    actorRole,
    action: 'PERMISSION_GRANTED',
    entityType: 'role',
    entityId: roleName,
    newValue: { key },
  });

  return result;
}

export async function revokePermission({ roleName, key, actorId, actorRole }) {
  await permissionRepository.revokePermission(roleName, key);

  await auditLogService.record({
    actorId,
    actorRole,
    action: 'PERMISSION_REVOKED',
    entityType: 'role',
    entityId: roleName,
    oldValue: { key },
  });
}
