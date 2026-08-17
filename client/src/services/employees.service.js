import { api } from './api.js';

export async function listEmployees(params) {
  const { data } = await api.get('/employees', { params });
  return data;
}

export async function getEmployee(id) {
  const { data } = await api.get(`/employees/${id}`);
  return data.user;
}

export async function createEmployee(payload) {
  const { data } = await api.post('/employees', payload);
  return data.user;
}

export async function setEmployeeStatus(id, isActive) {
  const { data } = await api.patch(`/employees/${id}/status`, { isActive });
  return data.user;
}

export async function deleteEmployee(id) {
  await api.delete(`/employees/${id}`);
}

export async function updateEmployeeCredentials(id, updates) {
  const { data } = await api.patch(`/employees/${id}/credentials`, updates);
  return data.user;
}
