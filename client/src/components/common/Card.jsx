import clsx from 'clsx';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('bg-white rounded-xl border border-navy-900/10 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
