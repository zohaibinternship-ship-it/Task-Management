import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className="bg-white rounded-xl border border-navy-900/10 shadow-sm p-4 flex items-center gap-3">
      {Icon && (
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            accent ? 'bg-gold-100 text-gold-600' : 'bg-navy-900/5 text-navy-700',
          )}
        >
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-navy-500">{label}</p>
        <p className="text-xl font-semibold text-navy-900">{value}</p>
      </div>
    </div>
  );
}
