'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { getMembers, inviteMember, removeMember, type Member } from '@/lib/members';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { INPUT_CLASS } from '@/lib/constants';

export default function MembersPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    getMembers(currentWorkspace.id)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [currentWorkspace]);

  async function handleRemove(userId: string) {
    if (!currentWorkspace) return;
    if (!confirm('Remove this member from the workspace?')) return;
    await removeMember(currentWorkspace.id, userId);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  const myRole = currentWorkspace?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  if (!currentWorkspace) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-50">Members</h1>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                  {m.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-zinc-100">{m.user.fullName || m.user.username}</p>
                  <p className="text-xs text-zinc-500">{m.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {m.role}
                </span>
                {canManage && m.role !== 'owner' && m.userId !== user?.id && (
                  <button
                    onClick={() => handleRemove(m.userId)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          workspaceId={currentWorkspace.id}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            setShowInvite(false);
            getMembers(currentWorkspace.id).then(setMembers);
          }}
        />
      )}
    </div>
  );
}

function InviteModal({
  workspaceId,
  onClose,
  onInvited,
}: {
  workspaceId: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inviteMember(workspaceId, email, role);
      onInvited();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Invite member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        <FormField label="Email" hint="They must already have a DevFlow account">
          <input
            autoFocus
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
            placeholder="teammate@company.com"
          />
        </FormField>

        <FormField label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className={INPUT_CLASS}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
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
            {loading ? 'Inviting...' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}