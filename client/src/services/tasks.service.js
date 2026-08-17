import { api } from './api.js';

export async function listTasks(params) {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function listMyTasks(params) {
  const { data } = await api.get('/tasks/my', { params });
  return data;
}

export async function getTask(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data.task;
}

export async function getTaskHistory(id) {
  const { data } = await api.get(`/tasks/${id}/history`);
  return data.events;
}

export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload);
  return data.task;
}

export async function updateTask(id, payload) {
  const { data } = await api.patch(`/tasks/${id}`, payload);
  return data.task;
}

export async function assignTask(id, employeeId) {
  const { data } = await api.post(`/tasks/${id}/assign`, { employeeId });
  return data.task;
}

export async function cancelTask(id, reason) {
  const { data } = await api.post(`/tasks/${id}/cancel`, { reason });
  return data.task;
}

export async function startTask(id) {
  const { data } = await api.post(`/tasks/${id}/start`);
  return data.task;
}

export async function pauseTask(id) {
  const { data } = await api.post(`/tasks/${id}/pause`);
  return data.task;
}

export async function resumeTask(id) {
  const { data } = await api.post(`/tasks/${id}/resume`);
  return data.task;
}

export async function completeTask(id) {
  const { data } = await api.post(`/tasks/${id}/complete`);
  return data.task;
}

export async function listTaskUpdates(id) {
  const { data } = await api.get(`/tasks/${id}/updates`);
  return data.updates;
}

export async function addTaskUpdate(id, message) {
  const { data } = await api.post(`/tasks/${id}/updates`, { message });
  return data.update;
}

export async function listTaskAttachments(id) {
  const { data } = await api.get(`/tasks/${id}/attachments`);
  return data.attachments;
}

export async function uploadTaskAttachments(id, files) {
  const formData = new FormData();
  for (const file of files) formData.append('files', file);
  const { data } = await api.post(`/tasks/${id}/attachments`, formData);
  return data.attachments;
}

export async function deleteTaskAttachment(id, attachmentId) {
  await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
}

export function attachmentDownloadUrl(id, attachmentId) {
  return `${api.defaults.baseURL}/tasks/${id}/attachments/${attachmentId}/download`;
}
