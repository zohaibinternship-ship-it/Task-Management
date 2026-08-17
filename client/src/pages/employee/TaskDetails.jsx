import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import * as tasksService from '../../services/tasks.service.js';
import { extractErrorMessage } from '../../services/api.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import TaskInfoCard from '../../components/tasks/TaskInfoCard.jsx';
import TaskHistoryTimeline from '../../components/tasks/TaskHistoryTimeline.jsx';
import TaskUpdatesPanel from '../../components/tasks/TaskUpdatesPanel.jsx';
import TaskAttachmentsPanel from '../../components/tasks/TaskAttachmentsPanel.jsx';

const ACTIONS = {
  pending: [{ key: 'start', label: 'Start Task', variant: 'gold', fn: tasksService.startTask }],
  in_progress: [
    { key: 'pause', label: 'Pause', variant: 'secondary', fn: tasksService.pauseTask },
    { key: 'complete', label: 'Mark Complete', variant: 'primary', fn: tasksService.completeTask },
  ],
  paused: [{ key: 'resume', label: 'Resume', variant: 'gold', fn: tasksService.resumeTask }],
};

export default function EmployeeTaskDetails() {
  const { id } = useParams();
  const { data: task, loading, error, refetch, setData: setTask } = useFetch(() => tasksService.getTask(id), [id]);
  const { data: history, refetch: refetchHistory } = useFetch(() => tasksService.getTaskHistory(id), [id]);
  const { data: updates, setData: setUpdates } = useFetch(
    () => tasksService.listTaskUpdates(id),
    [id],
  );
  const { data: attachments } = useFetch(() => tasksService.listTaskAttachments(id), [id]);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!task) return null;

  async function runAction(action) {
    setActionLoading(action.key);
    setActionError('');
    try {
      const updated = await action.fn(id);
      setTask(updated);
      refetchHistory();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddUpdate(message) {
    const update = await tasksService.addTaskUpdate(id, message);
    setUpdates((prev) => [update, ...(prev ?? [])]);
    refetchHistory();
  }

  const availableActions = ACTIONS[task.status] ?? [];

  return (
    <div className="space-y-4">
      {availableActions.length > 0 && (
        <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-navy-600">Update the status of this task as you work on it.</p>
          <div className="flex gap-2">
            {availableActions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant}
                loading={actionLoading === action.key}
                onClick={() => runAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TaskInfoCard task={task} />
          <TaskAttachmentsPanel taskId={id} attachments={attachments} canManage={false} />
          <TaskUpdatesPanel updates={updates} canAdd onAdd={handleAddUpdate} />
        </div>
        <div>
          <TaskHistoryTimeline events={history} />
        </div>
      </div>
    </div>
  );
}
