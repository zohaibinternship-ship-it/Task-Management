import { prisma } from '../config/prisma.js';

// Guards against ever having two open sessions for the same task (e.g. a
// double-submitted start/resume request). Callers run this inside the same
// transaction as the task's status-transition guard, so this check and the
// insert are atomic together.
export async function createOpen(taskId, employeeId, client = prisma) {
  const existing = await client.taskSession.findFirst({ where: { taskId, endedAt: null } });
  if (existing) return existing;
  return client.taskSession.create({ data: { taskId, employeeId, startedAt: new Date() } });
}

export function findOpenForTask(taskId, client = prisma) {
  return client.taskSession.findFirst({ where: { taskId, endedAt: null } });
}

export function findOpenForTasks(taskIds) {
  if (taskIds.length === 0) return Promise.resolve([]);
  return prisma.taskSession.findMany({ where: { taskId: { in: taskIds }, endedAt: null } });
}

export function closeSession(session, endedAt = new Date(), client = prisma) {
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
  return client.taskSession.update({
    where: { id: session.id },
    data: { endedAt, durationSeconds },
  });
}

export async function sumClosedDurationForTasks(taskIds) {
  if (taskIds.length === 0) return new Map();
  const rows = await prisma.taskSession.groupBy({
    by: ['taskId'],
    where: { taskId: { in: taskIds }, endedAt: { not: null } },
    _sum: { durationSeconds: true },
  });
  return new Map(rows.map((r) => [r.taskId, r._sum.durationSeconds ?? 0]));
}

export function findByTask(taskId) {
  return prisma.taskSession.findMany({
    where: { taskId },
    orderBy: { startedAt: 'desc' },
    include: { employee: { select: { id: true, name: true, email: true } } },
  });
}
