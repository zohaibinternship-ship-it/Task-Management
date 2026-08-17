import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as taskSessionRepository from '../repositories/taskSession.repository.js';
import * as auditLogService from './auditLog.service.js';
import { enrichTask } from './task.service.js';

async function loadOwnedTask(id, actorId) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');
  if (task.currentAssigneeId !== actorId) {
    throw ApiError.forbidden('This task is not assigned to you');
  }
  return task;
}

// The status check-and-set and the session open/close it triggers run inside
// one transaction, guarded by a conditional updateMany rather than a
// read-then-write. That closes a race where two concurrent requests (e.g. a
// double-submitted "start") could both read the same fromStatus and both
// pass the guard, leaving two open task_sessions rows for the same task.
async function transition({ id, actorId, actorRole, fromStatus, toStatus, action, onTransition }) {
  const task = await loadOwnedTask(id, actorId);

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.task.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus },
    });
    if (count === 0) {
      const current = await tx.task.findUnique({ where: { id }, select: { status: true } });
      throw ApiError.badRequest(`Cannot ${action.toLowerCase()} a task with status "${current?.status ?? task.status}"`);
    }

    if (onTransition) await onTransition(task, tx);

    return taskRepository.findById(id, tx);
  });

  // The audit write and the enrichment reads don't depend on each other's result.
  const [, enriched] = await Promise.all([
    auditLogService.record({
      actorId,
      actorRole,
      action,
      entityType: 'task',
      entityId: id,
      oldValue: { status: fromStatus },
      newValue: { status: toStatus },
    }),
    enrichTask(updated),
  ]);

  return enriched;
}

export function startTask({ id, actorId, actorRole }) {
  return transition({
    id,
    actorId,
    actorRole,
    fromStatus: 'pending',
    toStatus: 'in_progress',
    action: 'TASK_STARTED',
    onTransition: (task, tx) => taskSessionRepository.createOpen(id, actorId, tx),
  });
}

export function resumeTask({ id, actorId, actorRole }) {
  return transition({
    id,
    actorId,
    actorRole,
    fromStatus: 'paused',
    toStatus: 'in_progress',
    action: 'TASK_RESUMED',
    onTransition: (task, tx) => taskSessionRepository.createOpen(id, actorId, tx),
  });
}

async function closeOpenSession(taskId, tx) {
  const openSession = await taskSessionRepository.findOpenForTask(taskId, tx);
  if (!openSession) {
    throw ApiError.badRequest('No active work session found for this task');
  }
  await taskSessionRepository.closeSession(openSession, new Date(), tx);
}

export function pauseTask({ id, actorId, actorRole }) {
  return transition({
    id,
    actorId,
    actorRole,
    fromStatus: 'in_progress',
    toStatus: 'paused',
    action: 'TASK_PAUSED',
    onTransition: (task, tx) => closeOpenSession(id, tx),
  });
}

export function completeTask({ id, actorId, actorRole }) {
  return transition({
    id,
    actorId,
    actorRole,
    fromStatus: 'in_progress',
    toStatus: 'completed',
    action: 'TASK_COMPLETED',
    onTransition: (task, tx) => closeOpenSession(id, tx),
  });
}
