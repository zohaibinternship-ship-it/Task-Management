import clsx from 'clsx';

const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function PriorityBadge({ priority }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {priority}
    </span>
  );
}
