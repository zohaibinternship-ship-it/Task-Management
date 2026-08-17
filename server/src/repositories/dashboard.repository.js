import { prisma } from '../config/prisma.js';

const OVERDUE_FILTER = { deadline: { lt: new Date() }, status: { notIn: ['completed', 'cancelled'] } };

export async function employeeTaskCounts(employeeId) {
  const [total, pending, inProgress, paused, completed, overdue] = await Promise.all([
    prisma.task.count({ where: { currentAssigneeId: employeeId } }),
    prisma.task.count({ where: { currentAssigneeId: employeeId, status: 'pending' } }),
    prisma.task.count({ where: { currentAssigneeId: employeeId, status: 'in_progress' } }),
    prisma.task.count({ where: { currentAssigneeId: employeeId, status: 'paused' } }),
    prisma.task.count({ where: { currentAssigneeId: employeeId, status: 'completed' } }),
    prisma.task.count({ where: { currentAssigneeId: employeeId, ...OVERDUE_FILTER } }),
  ]);
  return { total, pending, inProgress, paused, completed, overdue };
}

export function activeSessionForEmployee(employeeId) {
  return prisma.taskSession.findFirst({
    where: { employeeId, endedAt: null },
    include: { task: { select: { id: true, code: true, title: true } } },
  });
}

export async function totalSecondsForEmployee(employeeId, since) {
  const result = await prisma.taskSession.aggregate({
    where: { employeeId, endedAt: { not: null }, ...(since ? { startedAt: { gte: since } } : {}) },
    _sum: { durationSeconds: true },
  });
  return result._sum.durationSeconds ?? 0;
}

export function recentUpdatesForEmployee(employeeId, take = 10) {
  return prisma.taskUpdate.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    take,
    include: { task: { select: { id: true, code: true, title: true } } },
  });
}

export async function companyTaskCounts() {
  const [total, pending, inProgress, completed, overdue] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'pending' } }),
    prisma.task.count({ where: { status: 'in_progress' } }),
    prisma.task.count({ where: { status: 'completed' } }),
    prisma.task.count({ where: OVERDUE_FILTER }),
  ]);
  return { total, pending, inProgress, completed, overdue };
}

export async function employeeCounts() {
  const [total, active] = await Promise.all([
    prisma.user.count({ where: { role: { name: 'employee' } } }),
    prisma.user.count({ where: { role: { name: 'employee' }, isActive: true } }),
  ]);
  return { total, active };
}

export async function totalHoursWorkedSeconds() {
  const result = await prisma.taskSession.aggregate({
    where: { endedAt: { not: null } },
    _sum: { durationSeconds: true },
  });
  return result._sum.durationSeconds ?? 0;
}

export function tasksDueSoon(withinDays = 3, take = 10) {
  const now = new Date();
  const soon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.task.findMany({
    where: { deadline: { gte: now, lte: soon }, status: { notIn: ['completed', 'cancelled'] } },
    orderBy: { deadline: 'asc' },
    take,
    select: { id: true, code: true, title: true, deadline: true, priority: true, status: true },
  });
}

export async function tasksByPriority() {
  const rows = await prisma.task.groupBy({ by: ['priority'], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.priority, r._count._all]));
}

export async function topEmployeesByHours(take = 10) {
  const rows = await prisma.taskSession.groupBy({
    by: ['employeeId'],
    where: { endedAt: { not: null } },
    _sum: { durationSeconds: true },
    orderBy: { _sum: { durationSeconds: 'desc' } },
    take,
  });
  const employees = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.employeeId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(employees.map((e) => [e.id, e]));
  return rows.map((r) => ({
    employee: byId.get(r.employeeId) ?? null,
    totalSeconds: r._sum.durationSeconds ?? 0,
  }));
}

export function recentAuditActivity(take = 15) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}
