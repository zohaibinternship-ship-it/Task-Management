import { api } from './api.js';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}
