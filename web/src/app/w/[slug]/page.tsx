'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { getProjects, createProject } from '@/lib/workspaces';
import { listIssues, createIssue, updateIssue } from '@/lib/issues';
import { STATUS_COLUMNS, PRIORITY_CONFIG } from '@/lib/constants';
import type { Project, Issue, IssueStatus } from '@/types';
import IssueDetailPanel from '@/components/IssueDetailPanel';

export default function IssuesBoardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showNewIssue, setShowNewIssue] = useState<IssueStatus | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;
    getProjects(currentWorkspace.id).then((data) => {
      setProjects(data);
      if (data.length > 0) setActiveProject(data[0]);
    });
  }, [currentWorkspace]);

  async function loadIssues() {
    if (!currentWorkspace || !activeProject) return;
    const res = await listIssues(currentWorkspace.id, activeProject.id, { limit: 100 });
    setIssues(res.data);
  }
  
  useEffect(() => {
    if (!currentWorkspace || !activeProject) return;
    loadIssues();
  }, [currentWorkspace, activeProject]);


  async function handleCreateProject() {
    if (!currentWorkspace) return;
    const name = prompt('Project name:');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const project = await createProject(currentWorkspace.id, { name, slug });
    setProjects((prev) => [...prev, project]);
    setActiveProject(project);
  }

  async function handleStatusChange(issue: Issue, newStatus: IssueStatus) {
    if (!currentWorkspace) return;
    const updated = await updateIssue(currentWorkspace.id, issue.id, { status: newStatus });
    setIssues((prev) => prev.map((i) => (i.id === issue.id ? updated : i)));
  }

  if (!currentWorkspace) return null;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                activeProject?.id === p.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Project
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {activeProject ? (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {STATUS_COLUMNS.map((col) => {
            const columnIssues = issues.filter((i) => i.status === col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium text-zinc-300">{col.label}</span>
                  <span className="text-xs text-zinc-600">{columnIssues.length}</span>
                  <button
                    onClick={() => setShowNewIssue(col.key)}
                    className="ml-auto text-zinc-600 hover:text-zinc-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {columnIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:border-zinc-700"
                    >
                      <p className="text-sm text-zinc-100 line-clamp-2">{issue.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs ${PRIORITY_CONFIG[issue.priority].color}`}>
                          {PRIORITY_CONFIG[issue.priority].label}
                        </span>
                        {issue.assignee && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                            {issue.assignee.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}

                  {showNewIssue === col.key && (
                    <NewIssueInline
                      onCancel={() => setShowNewIssue(null)}
                      onCreate={async (title) => {
                        if (!currentWorkspace || !activeProject) return;
                        const issue = await createIssue(currentWorkspace.id, activeProject.id, {
                          title,
                          status: col.key,
                        });
                        setIssues((prev) => [...prev, issue]);
                        setShowNewIssue(null);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-zinc-500">
          <div className="text-center">
            <p className="mb-3 text-sm">No projects yet</p>
            <button
              onClick={handleCreateProject}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900"
            >
              Create your first project
            </button>
          </div>
        </div>
      )}

      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={(updated) => {
            setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setSelectedIssue(updated);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function NewIssueInline({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (title: string) => void;
}) {
  const [title, setTitle] = useState('');

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) onCreate(title);
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => !title && onCancel()}
        placeholder="Issue title..."
        className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}