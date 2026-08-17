import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// server/uploads, sibling to src/ — kept outside src so it's obviously runtime data,
// not source. Per-task subfolder keeps the directory listable and makes bulk cleanup
// (if a task is ever purged) a single rmdir.
export const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

export function taskUploadDir(taskId) {
  return path.join(UPLOADS_ROOT, 'tasks', taskId);
}

export function ensureTaskUploadDir(taskId) {
  const dir = taskUploadDir(taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
