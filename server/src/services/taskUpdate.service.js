import { ApiError } from '../utils/ApiError.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as taskUpdateRepository from '../repositories/taskUpdate.repository.js';

export async function addUpdate({ taskId, actorId, message }) {
  const task = await taskRepository.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  if (task.currentAssigneeId !== actorId) {
    throw ApiError.forbidden('This task is not assigned to you');
  }
  return taskUpdateRepository.create({ taskId, employeeId: actorId, message });
}

export async function listUpdates({ taskId, requester }) {
  const task = await taskRepository.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  if (requester.role === 'employee' && task.currentAssigneeId !== requester.id) {
    throw ApiError.forbidden('This task is not assigned to you');
  }
  return taskUpdateRepository.findByTask(taskId);
}
