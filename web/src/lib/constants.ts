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