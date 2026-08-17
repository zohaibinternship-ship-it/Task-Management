export const fieldClass =
  'w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 ' +
  'placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 ' +
  'disabled:bg-surface-muted disabled:text-navy-400';

export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-navy-800">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-navy-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
