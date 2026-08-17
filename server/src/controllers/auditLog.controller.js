import { asyncHandler } from '../utils/asyncHandler.js';
import * as auditLogService from '../services/auditLog.service.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listForViewer(req.user, req.query);
  res.json(result);
});

export const listMyAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listMine(req.user.id, req.query);
  res.json(result);
});
