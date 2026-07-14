'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, MessageSquare, Sparkles, LogOut } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { getWorkspaceBySlug } from '@/lib/workspaces';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ready = useAuthGuard();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  const slug = params.slug as string;

  useEffect(() => {
    if (ready && slug) {
      getWorkspaceBySlug(slug).then(setCurrentWorkspace);
    }
  }, [ready, slug]);

  if (!ready || !currentWorkspace) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading...</div>;
  }

  const navItems = [
    { label: 'Issues', href: `/w/${slug}`, icon: LayoutGrid },
    { label: 'Chat', href: `/w/${slug}/chat`, icon: MessageSquare },
    { label: 'AI Assistant', href: `/w/${slug}/ai`, icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-6 flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-xs font-medium text-zinc-300">
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-sm font-medium text-zinc-100">{currentWorkspace.name}</span>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                  active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="mt-6 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}