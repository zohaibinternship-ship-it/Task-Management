export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <p className="text-navy-800 font-medium">{title}</p>
      {description && <p className="text-sm text-navy-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
