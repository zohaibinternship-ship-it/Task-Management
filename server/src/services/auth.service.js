import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateSessionToken, hashToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import * as userRepository from '../repositories/user.repository.js';
import * as sessionRepository from '../repositories/session.repository.js';
import * as auditLogService from './auditLog.service.js';

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

export async function login({ email, password, ipAddress, userAgent }) {
  const user = await userRepository.findByEmail(email);

  // Same generic error whether the account doesn't exist, is disabled, or the
  // password is wrong — never reveal which case it was.
  if (!user || !user.isActive) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 60 * 60 * 1000);

  // None of these three writes depend on each other's result, so run them
  // concurrently instead of paying the DB round-trip latency three times over.
  await Promise.all([
    sessionRepository.create({ userId: user.id, tokenHash, ipAddress, userAgent, expiresAt }),
    userRepository.touchLastLogin(user.id),
    auditLogService.record({
      actorId: user.id,
      actorRole: user.role.name,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      metadata: { ipAddress, userAgent },
    }),
  ]);

  return { token, expiresAt, user: sanitizeUser(user) };
}

export async function logout({ session, actorRole }) {
  await Promise.all([
    sessionRepository.revoke(session.id),
    auditLogService.record({
      actorId: session.userId,
      actorRole,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: session.userId,
    }),
  ]);
}

export async function changePassword({ userId, currentSessionId, currentPassword, newPassword, actorRole }) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await Promise.all([
    userRepository.updatePasswordHash(userId, newHash),
    sessionRepository.revokeAllForUserExcept(userId, currentSessionId),
    auditLogService.record({
      actorId: userId,
      actorRole,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
    }),
  ]);
}

// Super Admin changing another user's password (without current password verification)
export async function changePasswordForOtherUser({ userId, newPassword, actorId, actorRole }) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const newHash = await hashPassword(newPassword);
  // Revoke all sessions for the user when password is changed by super admin
  await Promise.all([
    userRepository.updatePasswordHash(userId, newHash),
    sessionRepository.revokeAllForUser(userId),
    auditLogService.record({
      actorId,
      actorRole,
      action: 'PASSWORD_CHANGED_BY_ADMIN',
      entityType: 'user',
      entityId: userId,
    }),
  ]);
}
