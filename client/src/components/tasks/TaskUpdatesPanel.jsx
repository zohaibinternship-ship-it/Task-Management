import { useState } from 'react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { fieldClass } from '../common/FormField.jsx';
import { formatDateTime } from '../../utils/format.js';
import { extractErrorMessage } from '../../services/api.js';

export default function TaskUpdatesPanel({ updates, canAdd, onAdd }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onAdd(message.trim());
      setMessage('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-navy-900 mb-4">Progress Updates</h2>

      {canAdd && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2">
          <textarea
            className={fieldClass}
            rows={3}
            placeholder="e.g. Completed login UI and started API integration."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" size="sm" loading={submitting} disabled={!message.trim()}>
            Post update
          </Button>
        </form>
      )}

      {!updates || updates.length === 0 ? (
        <EmptyState title="No updates yet" />
      ) : (
        <ul className="space-y-3">
          {updates.map((update) => (
            <li key={update.id} className="text-sm border-b border-navy-900/5 pb-3 last:border-0">
              <p className="text-navy-800 whitespace-pre-wrap">{update.message}</p>
              <p className="text-xs text-navy-500 mt-1">
                {update.employee?.name} · {formatDateTime(update.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
