import { asyncHandler } from '../utils/asyncHandler.js';
import * as taskWorkflowService from '../services/taskWorkflow.service.js';

function makeHandler(fn) {
  return asyncHandler(async (req, res) => {
    const task = await fn({ id: req.params.id, actorId: req.user.id, actorRole: req.user.role });
    res.json({ task });
  });
}

export const startTask = makeHandler(taskWorkflowService.startTask);
export const pauseTask = makeHandler(taskWorkflowService.pauseTask);
export const resumeTask = makeHandler(taskWorkflowService.resumeTask);
export const completeTask = makeHandler(taskWorkflowService.completeTask);
