import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from "date-fns";

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "dd MMM yyyy");
  } catch {
    return date;
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "dd MMM yyyy, HH:mm");
  } catch {
    return date;
  }
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return "";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return "";
  }
}

export function getDueBadgeVariant(
  dateStr: string | null
): "overdue" | "today" | "tomorrow" | "normal" {
  if (!dateStr) return "normal";
  try {
    const date = parseISO(dateStr);
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    if (isTomorrow(date)) return "tomorrow";
    return "normal";
  } catch {
    return "normal";
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
