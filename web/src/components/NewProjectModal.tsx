'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { INPUT_CLASS } from '@/lib/constants';
import { createProject } from '@/lib/workspaces';
import type { Project } from '@/types';

export default function NewProjectModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const project = await createProject(workspaceId, { name, slug });
      onCreated(project);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        <FormField label="Name">
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Frontend"
          />
        </FormField>

        <FormField label="Slug">
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={INPUT_CLASS}
            placeholder="frontend"
          />
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