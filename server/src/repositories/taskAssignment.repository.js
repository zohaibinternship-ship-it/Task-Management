import { prisma } from '../config/prisma.js';

export function create({ taskId, employeeId, assignedById }) {
  return prisma.taskAssignment.create({ data: { taskId, employeeId, assignedById } });
}

export function closeOpenForTask(taskId) {
  return prisma.taskAssignment.updateMany({
    where: { taskId, unassignedAt: null },
    data: { unassignedAt: new Date() },
  });
}

export function findHistoryForTask(taskId) {
  return prisma.taskAssignment.findMany({
    where: { taskId },
    orderBy: { assignedAt: 'desc' },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
    },
  });
}
