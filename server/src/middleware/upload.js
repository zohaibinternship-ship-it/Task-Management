import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { ensureTaskUploadDir } from '../utils/storage.js';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB per file
const MAX_FILES_PER_REQUEST = 5;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      cb(null, ensureTaskUploadDir(req.params.id));
    } catch (err) {
      cb(err);
    }
  },
  // Never trust the client-supplied filename for the on-disk name (path traversal,
  // collisions) — only the original name is kept, and only as a DB column for display.
  filename(req, file, cb) {
    cb(null, `${randomUUID()}${path.extname(file.originalname).slice(0, 20)}`);
  },
});

// No mimetype/extension allowlist — attachments are meant to accept any document format.
export const uploadTaskAttachments = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST },
}).array('files', MAX_FILES_PER_REQUEST);
