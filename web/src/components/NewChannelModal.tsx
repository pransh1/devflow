'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { INPUT_CLASS } from '@/lib/constants';
import { createChannel } from '@/lib/chat';
import type { Channel } from '@/types';

export default function NewChannelModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const channel = await createChannel(workspaceId, { name: cleanName });
      onCreated(channel);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="New channel" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        <FormField label="Channel name" hint="Lowercase letters, numbers, hyphens only">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">#</span>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="design-team"
            />
          </div>
        </FormField>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}