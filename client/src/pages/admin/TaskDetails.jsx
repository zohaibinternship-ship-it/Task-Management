import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import * as tasksService from '../../services/tasks.service.js';
import { listEmployees } from '../../services/employees.service.js';
import { extractErrorMessage } from '../../services/api.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FormField, { fieldClass } from '../../components/common/FormField.jsx';
import TaskInfoCard from '../../components/tasks/TaskInfoCard.jsx';
import TaskHistoryTimeline from '../../components/tasks/TaskHistoryTimeline.jsx';
import TaskUpdatesPanel from '../../components/tasks/TaskUpdatesPanel.jsx';
import TaskAttachmentsPanel from '../../components/tasks/TaskAttachmentsPanel.jsx';

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function AdminTaskDetails() {
  const { id } = useParams();
  const { data: task, loading, error, refetch, setData: setTask } = useFetch(() => tasksService.getTask(id), [id]);
  const { data: history, refetch: refetchHistory } = useFetch(() => tasksService.getTaskHistory(id), [id]);
  const { data: updates } = useFetch(() => tasksService.listTaskUpdates(id), [id]);
  const { data: attachments, setData: setAttachments } = useFetch(
    () => tasksService.listTaskAttachments(id),
    [id],
  );
  const { data: employeesData } = useFetch(() => listEmployees({ status: 'active', pageSize: 100 }));

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!task) return null;

  const canCancel = !['completed', 'cancelled'].includes(task.status);

  async function handleAssign(employeeId) {
    setBusy(true);
    setActionError('');
    try {
      const updated = await tasksService.assignTask(id, employeeId);
      setTask(updated);
      refetchHistory();
      setAssignOpen(false);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setActionError('');
    try {
      const updated = await tasksService.cancelTask(id);
      setTask(updated);
      refetchHistory();
      setCancelOpen(false);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadAttachments(files) {
    const uploaded = await tasksService.uploadTaskAttachments(id, files);
    setAttachments((prev) => [...uploaded, ...(prev ?? [])]);
  }

  async function handleDeleteAttachment(attachmentId) {
    await tasksService.deleteTaskAttachment(id, attachmentId);
    setAttachments((prev) => (prev ?? []).filter((a) => a.id !== attachmentId));
  }

  async function handleEditSubmit(changes) {
    setBusy(true);
    setActionError('');
    try {
      const updated = await tasksService.updateTask(id, changes);
      setTask(updated);
      refetchHistory();
      setEditOpen(false);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-navy-600">Admin-controlled task definition.</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAssignOpen(true)}>
            {task.currentAssignee ? 'Reassign' : 'Assign'}
          </Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {canCancel && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel Task
            </Button>
          )}
        </div>
      </Card>
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TaskInfoCard task={task} />
          <TaskAttachmentsPanel
            taskId={id}
            attachments={attachments}
            canManage
            onUpload={handleUploadAttachments}
            onDelete={handleDeleteAttachment}
          />
          <TaskUpdatesPanel updates={updates} canAdd={false} />
        </div>
        <div>
          <TaskHistoryTimeline events={history} />
        </div>
      </div>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        employees={employeesData?.users ?? []}
        currentAssigneeId={task.currentAssigneeId}
        onSubmit={handleAssign}
        busy={busy}
      />

      <EditModal open={editOpen} onClose={() => setEditOpen(false)} task={task} onSubmit={handleEditSubmit} busy={busy} />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this task?"
        message="This cannot be undone. The task will move to Cancelled status and stop counting toward active work."
        confirmLabel="Cancel Task"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}

function AssignModal({ open, onClose, employees, currentAssigneeId, onSubmit, busy }) {
  const [employeeId, setEmployeeId] = useState(currentAssigneeId ?? '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Task"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(employeeId)} disabled={!employeeId} loading={busy}>
            Assign
          </Button>
        </>
      }
    >
      <FormField label="Employee">
        <select className={fieldClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select an employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </FormField>
    </Modal>
  );
}

function EditModal({ open, onClose, task, onSubmit, busy }) {
  const [form, setForm] = useState(() => ({
    deadline: toDateInput(task.deadline),
    expectedHours: task.expectedHours ?? '',
    priority: task.priority,
    qaStatus: task.qaStatus,
    lineManagerApproval: task.lineManagerApproval,
  }));

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    onSubmit({
      deadline: form.deadline || null,
      expectedHours: form.expectedHours === '' ? null : Number(form.expectedHours),
      priority: form.priority,
      qaStatus: form.qaStatus,
      lineManagerApproval: form.lineManagerApproval,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Task"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormField label="Deadline">
          <input
            type="date"
            className={fieldClass}
            value={form.deadline}
            onChange={(e) => update('deadline', e.target.value)}
          />
        </FormField>
        <FormField label="Expected hours">
          <input
            type="number"
            min="0"
            step="0.5"
            className={fieldClass}
            value={form.expectedHours}
            onChange={(e) => update('expectedHours', e.target.value)}
          />
        </FormField>
        <FormField label="Priority">
          <select className={fieldClass} value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
        <FormField label="QA status">
          <select className={fieldClass} value={form.qaStatus} onChange={(e) => update('qaStatus', e.target.value)}>
            <option value="not_required">Not required</option>
            <option value="pending">Pending</option>
            <option value="in_review">In review</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </FormField>
        <FormField label="Line manager approval">
          <select
            className={fieldClass}
            value={form.lineManagerApproval}
            onChange={(e) => update('lineManagerApproval', e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
