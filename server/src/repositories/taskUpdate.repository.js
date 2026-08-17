import { prisma } from '../config/prisma.js';

export function create({ taskId, employeeId, message }) {
  return prisma.taskUpdate.create({
    data: { taskId, employeeId, message },
    include: { employee: { select: { id: true, name: true, email: true } } },
  });
}

export function findByTask(taskId) {
  return prisma.taskUpdate.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: { employee: { select: { id: true, name: true, email: true } } },
  });
}
