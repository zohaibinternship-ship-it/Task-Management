import Card from '../common/Card.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import PriorityBadge from '../common/PriorityBadge.jsx';
import { formatDate, formatDuration } from '../../utils/format.js';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-navy-900/5 last:border-0">
      <span className="text-navy-500">{label}</span>
      <span className="text-navy-900 font-medium text-right">{children ?? '—'}</span>
    </div>
  );
}

export default function TaskInfoCard({ task }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-mono text-navy-500">{task.code}</p>
          <h1 className="text-lg font-semibold text-navy-900">{task.title}</h1>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} overdue={task.isOverdue} />
        </div>
      </div>

      {task.description && <p className="text-sm text-navy-700 mb-4 whitespace-pre-wrap">{task.description}</p>}

      <div className="text-sm">
        <Row label="Assigned to">{task.currentAssignee?.name ?? 'Unassigned'}</Row>
        <Row label="Created by">{task.createdBy?.name}</Row>
        <Row label="Project">{task.project?.name}</Row>
        <Row label="Start date">{formatDate(task.startDate)}</Row>
        <Row label="Expected end date">{formatDate(task.expectedEndDate)}</Row>
        <Row label="Deadline">{formatDate(task.deadline)}</Row>
        <Row label="Expected hours">{task.expectedHours ? `${task.expectedHours}h` : '—'}</Row>
        <Row label="Spent hours">{formatDuration(task.spentSeconds)}</Row>
        <Row label="QA status">{task.qaStatus?.replace('_', ' ')}</Row>
        <Row label="Line manager approval">{task.lineManagerApproval}</Row>
      </div>

      {task.referenceLinks?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-navy-500 mb-1">Reference links</p>
          <ul className="space-y-1">
            {task.referenceLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="text-sm text-navy-700 underline break-all">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.deliverableLinks?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-navy-500 mb-1">Deliverable links</p>
          <ul className="space-y-1">
            {task.deliverableLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="text-sm text-navy-700 underline break-all">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
