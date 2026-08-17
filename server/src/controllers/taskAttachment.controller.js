import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as taskAttachmentService from '../services/taskAttachment.service.js';

export const uploadAttachments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('At least one file is required');
  }
  const attachments = await taskAttachmentService.addAttachments({
    taskId: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    files: req.files,
  });
  res.status(201).json({ attachments });
});

export const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await taskAttachmentService.listAttachments({
    taskId: req.params.id,
    requester: req.user,
  });
  res.json({ attachments });
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  const { attachment, absolutePath } = await taskAttachmentService.getAttachmentForDownload({
    taskId: req.params.id,
    attachmentId: req.params.attachmentId,
    requester: req.user,
  });
  res.download(absolutePath, attachment.fileName);
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  await taskAttachmentService.deleteAttachment({
    taskId: req.params.id,
    attachmentId: req.params.attachmentId,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.status(204).send();
});
