import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.employeeDashboard(req.user.id);
  res.json(data);
});

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.adminDashboard();
  res.json(data);
});

export const getReports = asyncHandler(async (req, res) => {
  const data = await dashboardService.reportsSummary();
  res.json(data);
});
