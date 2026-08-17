export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <p className="text-sm text-red-600 max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
