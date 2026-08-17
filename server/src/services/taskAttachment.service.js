import path from 'path';
import fs from 'fs/promises';
import { ApiError } from '../utils/ApiError.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as taskAttachmentRepository from '../repositories/taskAttachment.repository.js';
import * as auditLogService from './auditLog.service.js';
import { taskUploadDir } from '../utils/storage.js';

function assertViewable(task, requester) {
  if (requester.role === 'employee' && task.currentAssigneeId !== requester.id) {
    throw ApiError.forbidden('This task is not assigned to you');
  }
}

async function removeFilesQuietly(taskId, filePaths) {
  await Promise.all(
    filePaths.map((filePath) => fs.unlink(path.join(taskUploadDir(taskId), filePath)).catch(() => {})),
  );
}

export async function addAttachments({ taskId, actorId, actorRole, files }) {
  const task = await taskRepository.findById(taskId);
  if (!task) {
    await removeFilesQuietly(taskId, files.map((f) => f.filename));
    throw ApiError.notFound('Task not found');
  }

  const attachments = await Promise.all(
    files.map((file) =>
      taskAttachmentRepository.create({
        taskId,
        uploadedById: actorId,
        fileName: file.originalname,
        filePath: file.filename,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
      }),
    ),
  );

  await auditLogService.record({
    actorId,
    actorRole,
    action: 'TASK_ATTACHMENT_ADDED',
    entityType: 'task',
    entityId: taskId,
    newValue: { files: attachments.map((a) => a.fileName) },
  });

  return attachments;
}

export async function listAttachments({ taskId, requester }) {
  const task = await taskRepository.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  assertViewable(task, requester);
  return taskAttachmentRepository.findByTask(taskId);
}

export async function getAttachmentForDownload({ taskId, attachmentId, requester }) {
  const task = await taskRepository.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  assertViewable(task, requester);

  const attachment = await taskAttachmentRepository.findById(attachmentId);
  if (!attachment || attachment.taskId !== taskId) {
    throw ApiError.notFound('Attachment not found');
  }

  return { attachment, absolutePath: path.join(taskUploadDir(taskId), attachment.filePath) };
}

export async function deleteAttachment({ taskId, attachmentId, actorId, actorRole }) {
  const attachment = await taskAttachmentRepository.findById(attachmentId);
  if (!attachment || attachment.taskId !== taskId) {
    throw ApiError.notFound('Attachment not found');
  }

  await taskAttachmentRepository.remove(attachmentId);
  await fs.unlink(path.join(taskUploadDir(taskId), attachment.filePath)).catch(() => {});

  await auditLogService.record({
    actorId,
    actorRole,
    action: 'TASK_ATTACHMENT_REMOVED',
    entityType: 'task',
    entityId: taskId,
    oldValue: { fileName: attachment.fileName },
  });
}
