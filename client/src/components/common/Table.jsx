import clsx from 'clsx';

export default function Table({ columns, rows, keyField = 'id', onRowClick, emptyLabel = 'No records found' }) {
  if (!rows || rows.length === 0) {
    return <div className="py-10 text-center text-sm text-navy-500">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-900/10 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'border-b border-navy-900/5 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-surface-muted',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle whitespace-nowrap">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
