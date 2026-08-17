import { asyncHandler } from '../utils/asyncHandler.js';
import * as taskService from '../services/task.service.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({ actorId: req.user.id, actorRole: req.user.role, ...req.body });
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    id: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    changes: req.body,
  });
  res.json({ task });
});

export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask({
    id: req.params.id,
    employeeId: req.body.employeeId,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.json({ task });
});

export const cancelTask = asyncHandler(async (req, res) => {
  const task = await taskService.cancelTask({
    id: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    reason: req.body.reason,
  });
  res.json({ task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listTasks(req.query);
  res.json(result);
});

export const listMyTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listMyTasks({ employeeId: req.user.id, ...req.query });
  res.json(result);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user);
  res.json({ task });
});

export const getTaskHistory = asyncHandler(async (req, res) => {
  const events = await taskService.getTaskHistory(req.params.id, req.user);
  res.json({ events });
});
