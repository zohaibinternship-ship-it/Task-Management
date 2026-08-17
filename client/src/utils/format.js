export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0h 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDateTime(value) {
  if (!value) return '—';
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value) {
  if (!value) return '—';
  return dateFormatter.format(new Date(value));
}

export function formatRelativeToNow(value) {
  if (!value) return '—';
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMinutes);
  if (abs < 1) return 'just now';
  if (abs < 60) return diffMinutes > 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return diffMinutes > 0 ? `in ${diffHours}h` : `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return diffMinutes > 0 ? `in ${diffDays}d` : `${diffDays}d ago`;
}
