import { prisma } from '../config/prisma.js';

const detailInclude = {
  project: true,
  createdBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
};

export function generateTaskCode(sequence) {
  return `TSK-${String(sequence).padStart(3, '0')}`;
}

export async function nextSequence() {
  const count = await prisma.task.count();
  return count + 1;
}

export function create(data) {
  return prisma.task.create({ data, include: detailInclude });
}

export function findById(id, client = prisma) {
  return client.task.findUnique({ where: { id }, include: detailInclude });
}

export function update(id, data, client = prisma) {
  return client.task.update({ where: { id }, data, include: detailInclude });
}

export function findMany({ where, skip, take, orderBy }) {
  return prisma.task.findMany({ where, skip, take, orderBy: orderBy ?? { createdAt: 'desc' }, include: detailInclude });
}

export function count(where) {
  return prisma.task.count({ where });
}

export function findAssigneesByIds(ids) {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
}
