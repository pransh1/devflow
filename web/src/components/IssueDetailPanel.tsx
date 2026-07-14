'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { updateIssue, addComment } from '@/lib/issues';
import { STATUS_COLUMNS, PRIORITY_CONFIG } from '@/lib/constants';
import type { Issue, IssueStatus, IssuePriority } from '@/types';

export default function IssueDetailPanel({
  issue,
  onClose,
  onUpdate,
  onStatusChange,
}: {
  issue: Issue;
  onClose: () => void;
  onUpdate: (issue: Issue) => void;
  onStatusChange: (issue: Issue, status: IssueStatus) => void;
}) {
  const { currentWorkspace } = useWorkspaceStore();
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  async function handlePriorityChange(priority: IssuePriority) {
    if (!currentWorkspace) return;
    const updated = await updateIssue(currentWorkspace.id, issue.id, { priority });
    onUpdate(updated);
  }

  async function handleAddComment() {
    if (!currentWorkspace || !comment.trim()) return;
    setPosting(true);
    try {
      await addComment(currentWorkspace.id, issue.id, comment);
      setComment('');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Issue</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mb-4 text-lg font-medium text-zinc-100">{issue.title}</h2>

        {issue.description && (
          <p className="mb-6 text-sm text-zinc-400">{issue.description}</p>
        )}

        <div className="mb-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Status</label>
            <select
              value={issue.status}
              onChange={(e) => onStatusChange(issue, e.target.value as IssueStatus)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            >
              {STATUS_COLUMNS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Priority</label>
            <select
              value={issue.priority}
              onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <label className="mb-2 block text-xs text-zinc-500">Add comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            placeholder="Write a comment..."
          />
          <button
            onClick={handleAddComment}
            disabled={posting || !comment.trim()}
            className="mt-2 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}