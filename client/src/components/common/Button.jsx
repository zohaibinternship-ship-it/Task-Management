import clsx from 'clsx';

const variants = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-900',
  gold: 'bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:outline-gold-500',
  secondary: 'bg-white text-navy-800 border border-navy-900/15 hover:bg-surface-muted focus-visible:outline-navy-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-navy-700 hover:bg-navy-900/5 focus-visible:outline-navy-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  );
}
