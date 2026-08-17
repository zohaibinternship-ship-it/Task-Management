import { useRef, useState } from 'react';
import { Paperclip, Download, Trash2 } from 'lucide-react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { formatDateTime, formatFileSize } from '../../utils/format.js';
import { attachmentDownloadUrl } from '../../services/tasks.service.js';
import { extractErrorMessage } from '../../services/api.js';

export default function TaskAttachmentsPanel({ taskId, attachments, canManage, onUpload, onDelete }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      await onUpload(files);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachment) {
    setDeletingId(attachment.id);
    setError('');
    try {
      await onDelete(attachment.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-navy-900">Attachments</h2>
        {canManage && (
          <>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
            <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={14} />
              Attach file
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {!attachments || attachments.length === 0 ? (
        <EmptyState title="No attachments yet" />
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 text-sm border-b border-navy-900/5 pb-2 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-navy-800 truncate">{attachment.fileName}</p>
                <p className="text-xs text-navy-500">
                  {formatFileSize(attachment.fileSize)} · {attachment.uploadedBy?.name} ·{' '}
                  {formatDateTime(attachment.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={attachmentDownloadUrl(taskId, attachment.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-navy-500 hover:text-navy-900"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                {canManage && (
                  <button
                    type="button"
                    className="p-1.5 text-navy-500 hover:text-red-600 disabled:opacity-50"
                    disabled={deletingId === attachment.id}
                    onClick={() => handleDelete(attachment)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
