import { prisma } from '../config/prisma.js';

export function create(entry) {
  return prisma.auditLog.create({ data: entry });
}

export function findMany({ where, skip, take, orderBy } = {}) {
  return prisma.auditLog.findMany({
    where,
    skip,
    take,
    orderBy: orderBy ?? { createdAt: 'desc' },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}

export function count(where) {
  return prisma.auditLog.count({ where });
}
