import { api } from './api.js';

export async function listAdmins(params) {
  const { data } = await api.get('/admins', { params });
  return data;
}

export async function getAdmin(id) {
  const { data } = await api.get(`/admins/${id}`);
  return data.user;
}

export async function createAdmin(payload) {
  const { data } = await api.post('/admins', payload);
  return data.user;
}

export async function setAdminStatus(id, isActive) {
  const { data } = await api.patch(`/admins/${id}/status`, { isActive });
  return data.user;
}

export async function deleteAdmin(id) {
  await api.delete(`/admins/${id}`);
}

export async function updateAdminCredentials(id, updates) {
  const { data } = await api.patch(`/admins/${id}/credentials`, updates);
  return data.user;
}
