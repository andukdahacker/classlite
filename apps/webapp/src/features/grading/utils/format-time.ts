export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const diff = Date.now() - new Date(dateStr).getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;
  const minutes = Math.floor(absDiff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isFuture ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isFuture ? `in ${days}d` : `${days}d ago`;
}
