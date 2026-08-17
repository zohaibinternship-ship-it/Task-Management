import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormField, { fieldClass } from '../common/FormField.jsx';
import PasswordInput from '../common/PasswordInput.jsx';
import { extractErrorDetails, extractErrorMessage } from '../../services/api.js';

const initialForm = { name: '', email: '', password: '' };

export default function CreateUserModal({ open, onClose, title, onCreate, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm(initialForm);
    setError('');
    setFieldErrors({});
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const user = await onCreate(form);
      setForm(initialForm);
      onCreated(user);
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
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Full name" htmlFor="name" error={fieldErrors.name}>
          <input
            id="name"
            required
            className={fieldClass}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
          <input
            id="email"
            type="email"
            required
            className={fieldClass}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </FormField>
        <FormField label="Temporary password" htmlFor="password" hint="At least 8 characters" error={fieldErrors.password}>
          <PasswordInput
            id="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
