import { prisma } from '../config/prisma.js';

const withUploader = { uploadedBy: { select: { id: true, name: true, email: true } } };

export function create(data) {
  return prisma.taskAttachment.create({ data, include: withUploader });
}

export function findByTask(taskId) {
  return prisma.taskAttachment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: withUploader,
  });
}

export function findById(id) {
  return prisma.taskAttachment.findUnique({ where: { id } });
}

export function remove(id) {
  return prisma.taskAttachment.delete({ where: { id } });
}
