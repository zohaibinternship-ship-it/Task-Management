import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { extractErrorMessage } from '../../services/api.js';
import Button from '../../components/common/Button.jsx';
import FormField, { fieldClass } from '../../components/common/FormField.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Logo from '../../components/common/Logo.jsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const home = user.role === 'employee' ? '/' : '/admin';
    return <Navigate to={location.state?.from?.pathname ?? home} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      const home = loggedInUser.role === 'employee' ? '/' : '/admin';
      navigate(home, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Logo size={40} />
            <span className="text-white font-bold text-lg tracking-wide">TMS</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Task Management System</h1>
          <p className="text-sm text-white/50 mt-1">Sign in with the credentials your administrator gave you</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 space-y-4">
          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="you@company.com"
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
