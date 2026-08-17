import { asyncHandler } from '../utils/asyncHandler.js';
import * as taskUpdateService from '../services/taskUpdate.service.js';

export const addTaskUpdate = asyncHandler(async (req, res) => {
  const update = await taskUpdateService.addUpdate({
    taskId: req.params.id,
    actorId: req.user.id,
    message: req.body.message,
  });
  res.status(201).json({ update });
});

export const listTaskUpdates = asyncHandler(async (req, res) => {
  const updates = await taskUpdateService.listUpdates({ taskId: req.params.id, requester: req.user });
  res.json({ updates });
});
