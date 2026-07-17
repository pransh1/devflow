import type { IssueStatus, IssuePriority } from '@/types';

export const STATUS_COLUMNS: { key: IssueStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'bg-zinc-600' },
  { key: 'todo', label: 'Todo', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { key: 'done', label: 'Done', color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-zinc-700' },
];

export const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-400' },
  high: { label: 'High', color: 'text-orange-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  low: { label: 'Low', color: 'text-blue-400' },
  no_priority: { label: 'No priority', color: 'text-zinc-500' },
};

export const INPUT_CLASS =
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600 placeholder:text-zinc-600';