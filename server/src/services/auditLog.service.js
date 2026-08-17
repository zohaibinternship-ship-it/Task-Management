import * as auditLogRepository from '../repositories/auditLog.repository.js';
import { roleNameHasPermission } from '../repositories/permission.repository.js';

// The one place the RolePermission system currently gates something (see schema.prisma
// header notes): by default an Admin cannot see audit entries about Super Admin managing
// other Admins. Granting this permission key to the 'admin' role lifts that restriction.
const VIEW_ADMIN_ACTIONS_PERMISSION = 'audit_logs:view_admin_actions';

// Central place all audit entries are written from, so the shape is consistent
// everywhere (login, task changes, user management, etc.).
export function record({
  actorId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  metadata = null,
}) {
  return auditLogRepository.create({
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    oldValue: oldValue ?? undefined,
    newValue: newValue ?? undefined,
    metadata: metadata ?? undefined,
  });
}

export function list(filters) {
  return auditLogRepository.findMany(filters);
}

export function countAll(where) {
  return auditLogRepository.count(where);
}

export async function listMine(actorId, { page, pageSize }) {
  const where = { actorId };
  const [logs, total] = await Promise.all([
    auditLogRepository.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
    auditLogRepository.count(where),
  ]);
  return {
    logs,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function listForViewer({ role }, { action, entityType, actorId, page, pageSize }) {
  let where = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(actorId ? { actorId } : {}),
  };

  if (role !== 'super_admin') {
    const canViewAdminActions = await roleNameHasPermission(role, VIEW_ADMIN_ACTIONS_PERMISSION);
    if (!canViewAdminActions) {
      where = { ...where, NOT: { action: { startsWith: 'ADMIN_' } } };
    }
  }

  const [logs, total] = await Promise.all([
    auditLogRepository.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
    auditLogRepository.count(where),
  ]);

  return {
    logs,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}
