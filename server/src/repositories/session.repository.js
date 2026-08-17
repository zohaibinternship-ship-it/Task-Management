import { prisma } from '../config/prisma.js';

export function create({ userId, tokenHash, ipAddress, userAgent, expiresAt }) {
  return prisma.session.create({
    data: { userId, tokenHash, ipAddress, userAgent, expiresAt },
  });
}

export function findValidByTokenHash(tokenHash) {
  return prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { include: { role: true } } },
  });
}

export function revoke(id) {
  return prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
}

export function revokeAllForUserExcept(userId, exceptSessionId) {
  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

// Revoke all sessions for a user (used when Super Admin changes their password)
export function revokeAllForUser(userId) {
  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
