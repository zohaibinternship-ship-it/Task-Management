import { api } from './api.js';

export async function getEmployeeDashboard() {
  const { data } = await api.get('/dashboard/employee');
  return data;
}

export async function getAdminDashboard() {
  const { data } = await api.get('/dashboard/admin');
  return data;
}

export async function getReports() {
  const { data } = await api.get('/dashboard/reports');
  return data;
}
