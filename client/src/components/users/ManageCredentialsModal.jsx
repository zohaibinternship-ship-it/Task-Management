import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormField, { fieldClass } from '../common/FormField.jsx';
import PasswordInput from '../common/PasswordInput.jsx';
import { extractErrorDetails, extractErrorMessage } from '../../services/api.js';

const emptyForm = { name: '', email: '', password: '' };

export default function ManageCredentialsModal({ open, onClose, user, onUpdate, onUpdated }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the form from the current user whenever the modal is (re)opened for them.
  useEffect(() => {
    if (open && user) {
      setForm({ name: user.name, email: user.email, password: '' });
      setError('');
      setFieldErrors({});
    }
  }, [open, user]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const updates = {};
      if (form.name !== user.name) updates.name = form.name;
      if (form.email !== user.email) updates.email = form.email;
      if (form.password) updates.password = form.password;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const updated = await onUpdate(user.id, updates);
      onUpdated(updated);
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

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Manage Credentials — ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Full name" htmlFor="cred-name" error={fieldErrors.name}>
          <input
            id="cred-name"
            required
            className={fieldClass}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </FormField>
        <FormField label="Email" htmlFor="cred-email" error={fieldErrors.email}>
          <input
            id="cred-email"
            type="email"
            required
            className={fieldClass}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </FormField>
        <FormField
          label="New password"
          htmlFor="cred-password"
          hint="Leave blank to keep their current password. Setting one signs them out everywhere."
          error={fieldErrors.password}
        >
          <PasswordInput
            id="cred-password"
            minLength={8}
            placeholder="Leave blank to keep current password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
