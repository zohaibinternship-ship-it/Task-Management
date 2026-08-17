import clsx from 'clsx';

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500 line-through',
  overdue: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
};

export default function StatusBadge({ status, overdue }) {
  const key = overdue ? 'overdue' : status;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {overdue ? 'Overdue' : (STATUS_LABELS[status] ?? status)}
    </span>
  );
}
