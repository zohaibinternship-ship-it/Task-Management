import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { listEmployees } from '../../services/employees.service.js';
import { createTask, uploadTaskAttachments } from '../../services/tasks.service.js';
import { extractErrorDetails, extractErrorMessage } from '../../services/api.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import FormField, { fieldClass } from '../../components/common/FormField.jsx';

const initialForm = {
  title: '',
  description: '',
  assigneeId: '',
  startDate: '',
  expectedEndDate: '',
  deadline: '',
  expectedHours: '',
  priority: 'medium',
  referenceLinks: '',
};

export default function TaskCreate() {
  const navigate = useNavigate();
  const { data: employeesData } = useFetch(() => listEmployees({ status: 'active', pageSize: 100 }));
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const task = await createTask({
        title: form.title,
        description: form.description || undefined,
        assigneeId: form.assigneeId || undefined,
        startDate: form.startDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
        deadline: form.deadline || undefined,
        expectedHours: form.expectedHours ? Number(form.expectedHours) : undefined,
        priority: form.priority,
        referenceLinks: form.referenceLinks
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      });
      if (files.length > 0) {
        await uploadTaskAttachments(task.id, files);
      }
      navigate(`/admin/tasks/${task.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
      const details = extractErrorDetails(err);
      if (Array.isArray(details)) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-navy-900">Create Task</h1>
        <p className="text-sm text-navy-500">Define the task; assignment can be changed later.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" htmlFor="title" error={fieldErrors.title}>
            <input
              id="title"
              required
              className={fieldClass}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={3}
              className={fieldClass}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assign to" htmlFor="assigneeId">
              <select
                id="assigneeId"
                className={fieldClass}
                value={form.assigneeId}
                onChange={(e) => update('assigneeId', e.target.value)}
              >
                <option value="">Unassigned</option>
                {employeesData?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority" htmlFor="priority">
              <select
                id="priority"
                className={fieldClass}
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Start date" htmlFor="startDate" error={fieldErrors.startDate}>
              <input
                id="startDate"
                type="date"
                className={fieldClass}
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
            </FormField>
            <FormField label="Expected end date" htmlFor="expectedEndDate" error={fieldErrors.expectedEndDate}>
              <input
                id="expectedEndDate"
                type="date"
                className={fieldClass}
                value={form.expectedEndDate}
                onChange={(e) => update('expectedEndDate', e.target.value)}
              />
            </FormField>
            <FormField label="Deadline" htmlFor="deadline" error={fieldErrors.deadline}>
              <input
                id="deadline"
                type="date"
                className={fieldClass}
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Expected working hours" htmlFor="expectedHours" error={fieldErrors.expectedHours}>
            <input
              id="expectedHours"
              type="number"
              min="0"
              step="0.5"
              className={fieldClass}
              value={form.expectedHours}
              onChange={(e) => update('expectedHours', e.target.value)}
            />
          </FormField>

          <FormField label="Reference links" htmlFor="referenceLinks" hint="One URL per line">
            <textarea
              id="referenceLinks"
              rows={2}
              className={fieldClass}
              value={form.referenceLinks}
              onChange={(e) => update('referenceLinks', e.target.value)}
            />
          </FormField>

          <FormField label="Attachments" htmlFor="attachments" hint="Any file format, up to 25MB each">
            <input
              id="attachments"
              type="file"
              multiple
              className={fieldClass}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 && (
              <ul className="mt-1 text-xs text-navy-500 list-disc list-inside">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/tasks')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
