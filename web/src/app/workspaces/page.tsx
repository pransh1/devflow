'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { getMyWorkspaces, createWorkspace } from '@/lib/workspaces';
import type { Workspace } from '@/types';

export default function WorkspacesPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (ready) {
      getMyWorkspaces()
        .then(setWorkspaces)
        .finally(() => setLoading(false));
    }
  }, [ready]);

  if (!ready || loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-50">Your workspaces</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            New workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 py-16 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">No workspaces yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-zinc-100 hover:underline"
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(`/w/${ws.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-sm font-medium text-zinc-300">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{ws.name}</p>
                  <p className="text-xs text-zinc-500">{ws.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={(ws) => {
            setWorkspaces((prev) => [ws, ...prev]);
            setShowCreate(false);
            router.push(`/w/${ws.slug}`);
          }}
        />
      )}
    </div>
  );
}

function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ws: Workspace) => void;
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
      const ws = await createWorkspace({ name, slug });
      onCreated(ws);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Create workspace</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Name</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              placeholder="My Team"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              placeholder="my-team"
            />
          </div>

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
      </div>
    </div>
  );
}