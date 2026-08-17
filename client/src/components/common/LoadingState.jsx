export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-navy-600">
      <span className="h-5 w-5 rounded-full border-2 border-navy-200 border-t-gold-500 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
