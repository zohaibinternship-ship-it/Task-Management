import { ApiError } from '../utils/ApiError.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as taskAssignmentRepository from '../repositories/taskAssignment.repository.js';
import * as taskUpdateRepository from '../repositories/taskUpdate.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import * as auditLogService from './auditLog.service.js';
import { attachTimeTracking } from './taskTimeTracking.service.js';
import { TERMINAL_STATUSES } from '../constants/taskStatus.js';

function isOverdue(task) {
  return Boolean(task.deadline) && new Date(task.deadline) < new Date() && !TERMINAL_STATUSES.includes(task.status);
}

export async function enrichTasks(tasks) {
  const assigneeIds = [...new Set(tasks.map((t) => t.currentAssigneeId).filter(Boolean))];
  const assignees = await taskRepository.findAssigneesByIds(assigneeIds);
  const byId = new Map(assignees.map((a) => [a.id, a]));
  const withAssignee = tasks.map((task) => ({
    ...task,
    isOverdue: isOverdue(task),
    currentAssignee: task.currentAssigneeId ? byId.get(task.currentAssigneeId) ?? null : null,
  }));
  return attachTimeTracking(withAssignee);
}

export async function enrichTask(task) {
  const [enriched] = await enrichTasks([task]);
  return enriched;
}

async function assertActiveEmployee(employeeId) {
  const employee = await userRepository.findById(employeeId);
  if (!employee || employee.role.name !== 'employee') {
    throw ApiError.badRequest('assigneeId must refer to an employee account');
  }
  if (!employee.isActive) {
    throw ApiError.badRequest('Cannot assign a task to a deactivated employee');
  }
  return employee;
}

async function createTaskWithUniqueCode(data) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sequence = (await taskRepository.nextSequence()) + attempt;
    const code = taskRepository.generateTaskCode(sequence);
    try {
      return await taskRepository.create({ ...data, code });
    } catch (err) {
      if (err.code === 'P2002' && attempt < 4) continue;
      throw err;
    }
  }
  throw ApiError.internal('Could not generate a unique task code, please retry');
}

export async function createTask({ actorId, actorRole, ...input }) {
  if (input.assigneeId) {
    await assertActiveEmployee(input.assigneeId);
  }

  const { assigneeId, ...taskFields } = input;
  const task = await createTaskWithUniqueCode({
    ...taskFields,
    createdById: actorId,
    currentAssigneeId: assigneeId ?? null,
  });

  const writes = [
    auditLogService.record({
      actorId,
      actorRole,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      newValue: { title: task.title, priority: task.priority, assigneeId: assigneeId ?? null },
    }),
  ];

  if (assigneeId) {
    writes.push(
      taskAssignmentRepository.create({ taskId: task.id, employeeId: assigneeId, assignedById: actorId }),
      auditLogService.record({
        actorId,
        actorRole,
        action: 'TASK_ASSIGNED',
        entityType: 'task',
        entityId: task.id,
        newValue: { employeeId: assigneeId },
      }),
    );
  }

  await Promise.all(writes);

  return enrichTask(task);
}

export async function updateTask({ id, actorId, actorRole, changes }) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');

  const data = { ...changes };

  if (Object.prototype.hasOwnProperty.call(changes, 'lineManagerApproval')) {
    if (changes.lineManagerApproval === 'approved') {
      data.approvedById = actorId;
      data.approvedAt = new Date();
    } else {
      data.approvedById = null;
      data.approvedAt = null;
    }
  }

  const updated = await taskRepository.update(id, data);

  // Deadline and expected-hours changes get their own named audit action per the
  // spec's audit example; everything else is folded into one TASK_UPDATED entry.
  // None of these audit writes depend on each other, so fire them concurrently.
  const auditWrites = [];
  if (Object.prototype.hasOwnProperty.call(changes, 'deadline')) {
    auditWrites.push(
      auditLogService.record({
        actorId,
        actorRole,
        action: 'TASK_DEADLINE_CHANGED',
        entityType: 'task',
        entityId: id,
        oldValue: { deadline: task.deadline },
        newValue: { deadline: updated.deadline },
      }),
    );
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'expectedHours')) {
    auditWrites.push(
      auditLogService.record({
        actorId,
        actorRole,
        action: 'TASK_EXPECTED_HOURS_CHANGED',
        entityType: 'task',
        entityId: id,
        oldValue: { expectedHours: task.expectedHours },
        newValue: { expectedHours: updated.expectedHours },
      }),
    );
  }

  const otherFields = Object.keys(changes).filter((k) => k !== 'deadline' && k !== 'expectedHours');
  if (otherFields.length > 0) {
    auditWrites.push(
      auditLogService.record({
        actorId,
        actorRole,
        action: 'TASK_UPDATED',
        entityType: 'task',
        entityId: id,
        oldValue: Object.fromEntries(otherFields.map((k) => [k, task[k]])),
        newValue: Object.fromEntries(otherFields.map((k) => [k, updated[k]])),
      }),
    );
  }

  await Promise.all(auditWrites);

  return enrichTask(updated);
}

export async function assignTask({ id, employeeId, actorId, actorRole }) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');
  if (TERMINAL_STATUSES.includes(task.status)) {
    throw ApiError.badRequest(`Cannot reassign a ${task.status} task`);
  }

  await assertActiveEmployee(employeeId);

  const previousAssigneeId = task.currentAssigneeId;
  if (previousAssigneeId === employeeId) {
    return enrichTask(task);
  }

  // These four writes touch different rows/tables and none depend on another's
  // result (previousAssigneeId is already known), so run them concurrently.
  const [, , updated] = await Promise.all([
    taskAssignmentRepository.closeOpenForTask(id),
    taskAssignmentRepository.create({ taskId: id, employeeId, assignedById: actorId }),
    taskRepository.update(id, { currentAssigneeId: employeeId }),
    auditLogService.record({
      actorId,
      actorRole,
      action: previousAssigneeId ? 'TASK_REASSIGNED' : 'TASK_ASSIGNED',
      entityType: 'task',
      entityId: id,
      oldValue: { employeeId: previousAssigneeId },
      newValue: { employeeId },
    }),
  ]);

  return enrichTask(updated);
}

export async function cancelTask({ id, actorId, actorRole, reason }) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');
  if (TERMINAL_STATUSES.includes(task.status)) {
    throw ApiError.badRequest(`Task is already ${task.status}`);
  }

  const [updated] = await Promise.all([
    taskRepository.update(id, { status: 'cancelled' }),
    auditLogService.record({
      actorId,
      actorRole,
      action: 'TASK_CANCELLED',
      entityType: 'task',
      entityId: id,
      oldValue: { status: task.status },
      newValue: { status: 'cancelled', reason: reason ?? null },
    }),
  ]);

  return enrichTask(updated);
}

function buildOverdueWhere(overdue) {
  if (overdue === undefined) return {};
  if (overdue) {
    return { deadline: { lt: new Date() }, status: { notIn: TERMINAL_STATUSES } };
  }
  return {
    OR: [{ deadline: null }, { deadline: { gte: new Date() } }, { status: { in: TERMINAL_STATUSES } }],
  };
}

function buildListWhere({ status, priority, assigneeId, projectId, overdue, search }) {
  return {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assigneeId ? { currentAssigneeId: assigneeId } : {}),
    ...(projectId ? { projectId } : {}),
    ...buildOverdueWhere(overdue),
    ...(search
      ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
      : {}),
  };
}

export async function listTasks(filters) {
  const where = buildListWhere(filters);
  const { page, pageSize } = filters;
  const [tasks, total] = await Promise.all([
    taskRepository.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
    taskRepository.count(where),
  ]);
  return {
    tasks: await enrichTasks(tasks),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function listMyTasks({ employeeId, ...filters }) {
  return listTasks({ ...filters, assigneeId: employeeId });
}

function assertViewable(task, requester) {
  if (requester.role === 'employee' && task.currentAssigneeId !== requester.id) {
    throw ApiError.forbidden('You can only view tasks assigned to you');
  }
}

export async function getTaskById(id, requester) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');
  assertViewable(task, requester);
  return enrichTask(task);
}

// Merges the generic audit trail (created/assigned/reassigned/started/paused/resumed/
// completed/cancelled/field changes) with progress-update notes into one sorted timeline.
// Assignment and session rows aren't merged in separately — every one of those actions
// already produces a corresponding audit log entry, so including the raw tables too would
// just duplicate the same events under a different shape.
export async function getTaskHistory(id, requester) {
  const task = await taskRepository.findById(id);
  if (!task) throw ApiError.notFound('Task not found');
  assertViewable(task, requester);

  const [auditEntries, updates] = await Promise.all([
    auditLogService.list({ where: { entityType: 'task', entityId: id }, take: 500 }),
    taskUpdateRepository.findByTask(id),
  ]);

  const events = [
    ...auditEntries.map((entry) => ({
      type: 'AUDIT',
      timestamp: entry.createdAt,
      actor: entry.actor,
      actorRole: entry.actorRole,
      action: entry.action,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
    })),
    ...updates.map((update) => ({
      type: 'PROGRESS_UPDATE',
      timestamp: update.createdAt,
      actor: update.employee,
      message: update.message,
    })),
  ];

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events;
}
