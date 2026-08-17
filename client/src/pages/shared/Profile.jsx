import { useAuth } from '../../hooks/useAuth.js';
import Card from '../../components/common/Card.jsx';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Profile</h1>
        <p className="text-sm text-navy-500">Your account details.</p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-navy-900 mb-3">Account</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-navy-500">Name</dt>
            <dd className="text-navy-900 font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Email</dt>
            <dd className="text-navy-900 font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Role</dt>
            <dd className="text-navy-900 font-medium capitalize">{user?.role?.replace('_', ' ')}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
