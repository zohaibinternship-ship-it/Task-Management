import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { formatDateTime } from '../../utils/format.js';

const ACTION_LABELS = {
  TASK_CREATED: 'Task created',
  TASK_ASSIGNED: 'Task assigned',
  TASK_REASSIGNED: 'Task reassigned',
  TASK_UPDATED: 'Task details updated',
  TASK_DEADLINE_CHANGED: 'Deadline changed',
  TASK_EXPECTED_HOURS_CHANGED: 'Expected hours changed',
  TASK_STARTED: 'Task started',
  TASK_PAUSED: 'Task paused',
  TASK_RESUMED: 'Task resumed',
  TASK_COMPLETED: 'Task completed',
  TASK_CANCELLED: 'Task cancelled',
};

function describeEvent(event) {
  if (event.type === 'PROGRESS_UPDATE') {
    return { title: 'Progress update', body: event.message };
  }
  const title = ACTION_LABELS[event.action] ?? event.action;
  let body = null;
  if (event.action === 'TASK_DEADLINE_CHANGED') {
    body = `${event.oldValue?.deadline ? formatDateTime(event.oldValue.deadline) : '—'} → ${event.newValue?.deadline ? formatDateTime(event.newValue.deadline) : '—'}`;
  } else if (event.action === 'TASK_EXPECTED_HOURS_CHANGED') {
    body = `${event.oldValue?.expectedHours ?? '—'}h → ${event.newValue?.expectedHours ?? '—'}h`;
  }
  return { title, body };
}

export default function TaskHistoryTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <Card className="p-5">
        <EmptyState title="No history yet" description="Actions on this task will appear here." />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-navy-900 mb-4">Task History</h2>
      <ol className="relative border-l border-navy-900/10 pl-4 space-y-5">
        {events.map((event, idx) => {
          const { title, body } = describeEvent(event);
          return (
            <li key={idx} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gold-500" />
              <p className="text-sm font-medium text-navy-900">{title}</p>
              {body && <p className="text-sm text-navy-600 mt-0.5">{body}</p>}
              <p className="text-xs text-navy-500 mt-0.5">
                {event.actor?.name ?? 'System'} · {formatDateTime(event.timestamp)}
              </p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
