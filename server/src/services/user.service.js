import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import * as userRepository from '../repositories/user.repository.js';
import * as sessionRepository from '../repositories/session.repository.js';
import * as auditLogService from './auditLog.service.js';

async function getRoleByName(roleName) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    throw ApiError.internal(`Role "${roleName}" is not seeded`);
  }
  return role;
}

export async function createUser({ name, email, password, roleName, createdById, actorRole }) {
  // Role lookup (DB) and password hashing (CPU-bound) don't depend on each other.
  const [role, passwordHash] = await Promise.all([getRoleByName(roleName), hashPassword(password)]);

  let user;
  try {
    user = await userRepository.create({
      name,
      email,
      passwordHash,
      roleId: role.id,
      createdById,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.conflict('A user with this email already exists');
    }
    throw err;
  }

  await auditLogService.record({
    actorId: createdById,
    actorRole,
    action: roleName === 'admin' ? 'ADMIN_CREATED' : 'EMPLOYEE_CREATED',
    entityType: 'user',
    entityId: user.id,
    newValue: { name: user.name, email: user.email, role: roleName },
  });

  return sanitizeUser(user);
}

export async function listUsers({ roleName, search, status, page, pageSize }) {
  const where = {
    role: { name: roleName },
    ...(status === 'active' ? { isActive: true } : {}),
    ...(status === 'inactive' ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    userRepository.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    userRepository.count(where),
  ]);

  return {
    users: users.map(sanitizeUser),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getUserByIdForRole(id, roleName) {
  const user = await userRepository.findById(id);
  if (!user || user.role.name !== roleName) {
    throw ApiError.notFound('User not found');
  }
  return sanitizeUser(user);
}

export async function setActiveStatus({ id, roleName, isActive, actorId, actorRole }) {
  if (id === actorId && !isActive) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await userRepository.findById(id);
  if (!user || user.role.name !== roleName) {
    throw ApiError.notFound('User not found');
  }

  if (user.isActive === isActive) {
    return sanitizeUser(user);
  }

  const [updated] = await Promise.all([
    userRepository.update(id, { isActive }),
    auditLogService.record({
      actorId,
      actorRole,
      action: isActive
        ? (roleName === 'admin' ? 'ADMIN_ACTIVATED' : 'EMPLOYEE_ACTIVATED')
        : (roleName === 'admin' ? 'ADMIN_DEACTIVATED' : 'EMPLOYEE_DEACTIVATED'),
      entityType: 'user',
      entityId: id,
      oldValue: { isActive: user.isActive },
      newValue: { isActive },
    }),
  ]);

  return sanitizeUser(updated);
}

// Super Admin permanently deleting an Admin or Employee account. Only allowed when the
// account has no history (no tasks created/assigned/worked/audited) — the schema's FK
// constraints on tasks/assignments/sessions/updates are RESTRICT, not CASCADE, specifically
// so a hard delete can never silently wipe out task or audit history. Once an account has
// any activity, deactivation (setActiveStatus) is the only supported way to remove access.
export async function deleteUser({ id, roleName, actorId, actorRole }) {
  if (id === actorId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await userRepository.findById(id);
  if (!user || user.role.name !== roleName) {
    throw ApiError.notFound('User not found');
  }

  try {
    await userRepository.remove(id);
  } catch (err) {
    if (err.code === 'P2003') {
      throw ApiError.conflict(
        'This account has task or activity history and cannot be deleted. Deactivate it instead.',
      );
    }
    throw err;
  }

  await auditLogService.record({
    actorId,
    actorRole,
    action: roleName === 'admin' ? 'ADMIN_DELETED' : 'EMPLOYEE_DELETED',
    entityType: 'user',
    entityId: id,
    oldValue: { name: user.name, email: user.email },
  });
}

// Super Admin updating user credentials (email, name, password)
export async function updateUserCredentials({ userId, roleName, updates, actorId, actorRole }) {
  const user = await userRepository.findById(userId);
  if (!user || user.role.name !== roleName) {
    throw ApiError.notFound('User not found');
  }

  const updateData = {};
  const oldValue = {};
  const newValue = {};

  // Check if email is being updated
  if (updates.email && updates.email !== user.email) {
    // Check if email is already in use
    const existingUser = await userRepository.findByEmail(updates.email);
    if (existingUser && existingUser.id !== userId) {
      throw ApiError.conflict('A user with this email already exists');
    }
    updateData.email = updates.email;
    oldValue.email = user.email;
    newValue.email = updates.email;
  }

  // Check if name is being updated
  if (updates.name && updates.name !== user.name) {
    updateData.name = updates.name;
    oldValue.name = user.name;
    newValue.name = updates.name;
  }

  // Check if password is being updated
  if (updates.password) {
    const newHash = await hashPassword(updates.password);
    updateData.passwordHash = newHash;
    newValue.password = '***';
    oldValue.password = '***';
  }

  if (Object.keys(updateData).length === 0) {
    // No actual changes
    return sanitizeUser(user);
  }

  // Log the changes
  const action = roleName === 'admin'
    ? 'ADMIN_CREDENTIALS_UPDATED'
    : 'EMPLOYEE_CREDENTIALS_UPDATED';

  const writes = [
    userRepository.update(userId, updateData),
    auditLogService.record({
      actorId,
      actorRole,
      action,
      entityType: 'user',
      entityId: userId,
      oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
      newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    }),
  ];

  // Revoke all sessions if password was changed
  if (updates.password) {
    writes.push(sessionRepository.revokeAllForUser(userId));
  }

  const [updated] = await Promise.all(writes);

  return sanitizeUser(updated);
}
