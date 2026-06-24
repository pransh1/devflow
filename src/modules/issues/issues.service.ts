import { eq, and, sql, asc, desc, count } from 'drizzle-orm';
import { db } from '../../db';
import { projects, issues, issueComments, workspaceMembers, workspaces } from '../../db/schema';
import type { Issue } from '../../db/schema';
import { AppError } from '../../utils/AppError';
import { emitToWorkspace } from '../../socket';
import { getCache, setCache, deleteCache, CacheKeys, TTL } from '../../utils/cache';
import type {
  CreateProjectInput,
  CreateIssueInput,
  UpdateIssueInput,
  ListIssuesInput,
} from './issues.schema';

// ─── Projects ────────────────────────────────────────────────

export async function createProject(
  input: CreateProjectInput,
  workspaceId: string,
  userid: string
) {
  // Slug must be unique within the workspace
  const existing = await db.query.projects.findFirst({
    where: and(
      eq(projects.workspaceId, workspaceId),
      eq(projects.slug, input.slug)
    ),
  });

  if (existing) throw new AppError('Project slug already exists in this workspace', 409);

  const [project] = await db.insert(projects).values({ ...input, workspaceId, createdById: userid }).returning();

  return project;
};

export async function getProjects(workspaceId: string) {
  return await db.query.projects.findMany({
    where: eq(projects.workspaceId, workspaceId),
    with: {
      createdBy: {
        columns: {id: true, username: true, fullName: true, avatarUrl: true},
      },
    },
    orderBy: desc(projects.createdAt)
  });
};

export async function getProjectBySlug(workspaceId: string, slug: string) {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.workspaceId, workspaceId),
      eq(projects.slug, slug)
    ),
    with: {
      createdBy: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
    },
  });

  if (!project) throw new AppError('Project not found', 404);
  return project;
};


// ─── Issues ──────────────────────────────────────────────────

export async function createIssue(
  input: CreateIssueInput,
  projectId: string,
  workspaceId: string,
  userId: string
) {
  // Verify project belongs to workspace
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.workspaceId, workspaceId)
    ),
  });

  if(!project) throw new AppError('Project not found', 404);

  // If assignee provided, verify they are a workspace member
  if(input.assigneeId) {
    const isMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, input.assigneeId)
      ),
    });

    if(!isMember) throw new AppError('Assignee is not a workspace member', 400);
  };

  const [issue] = await db.insert(issues).values({ 
    ...input, 
    projectId, 
    workspaceId, 
    createdById: userId, 
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined, 
  }).returning();

  // Emit to all workspace members in real-time
  emitToWorkspace(workspaceId, 'issue:created', {
    issue,
    createdBy: userId,
  });

  return issue;
};

export async function listIssues(
  workspaceId: string,
  projectId: string,
  filters: ListIssuesInput
) {
  const { status, priority, assigneeId, page, limit, order } = filters;
  const offset = (page - 1) * limit;
   
  // Build where conditions dynamically
  const conditions = [
    eq(issues.workspaceId, workspaceId),
    eq(issues.projectId, projectId),
    ...(status ? [eq(issues.status, status)] : []),
    ...(priority ? [eq(issues.priority, priority)] : []),
    ...(assigneeId ? [eq(issues.assigneeId, assigneeId)] : []),
  ];

  const orderFn = order === 'asc' ? asc : desc;

  const [data, total] = await Promise.all([
    db.query.issues.findMany({
      where: and(...conditions),
      with: {
        assignee: {
          columns: {id: true, username: true, fullName: true, avatarUrl: true}
        },
        createdBy: {
          columns: {id: true, username: true, fullName: true, avatarUrl: true}
        },
      },
      orderBy: orderFn(issues.createdAt),
      limit,
      offset
    }),
    db.select({ count: count() }).from(issues).where(and(...conditions)),
  ]);

  return {
    data,
    pagination: {
      total: total[0].count,
      page,
      limit,
      totalPages: Math.ceil(total[0].count / limit)
    },
  };

};

export async function getIssueById(issueId: string, workspaceId: string) {
  // check cache first
  const cacheKey = CacheKeys.issue(issueId);
  const cached = await getCache<Issue>(cacheKey);
  if(cached) {
    console.log('cache hit: issue');
    return cached;
  }


  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId),
      eq(issues.workspaceId, workspaceId)
    ),
    with: {
      assignee: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
      createdBy: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
      comments: {
        with: {
          author: {
            columns: { id: true, username: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: asc(issueComments.createdAt),
      },
    },
  });

  if (!issue) throw new AppError('Issue not found', 404);
  
  // cache the result
  await setCache(cacheKey, issue, TTL.MEDIUM);
  
  return issue;

};

export async function updateIssue(issueId: string, workspaceId: string, input: UpdateIssueInput) {
  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId),
      eq(issues.workspaceId, workspaceId),
    ),
  });
  if(!issue) throw new AppError('Issue not found', 404);

  const [updated] = await db.update(issues)
                            .set({
                              ...input,
                              dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
                              updatedAt: new Date()
                            })
                            .where(eq(issues.id, issueId))
                            .returning()
  
  // bust issue cache so next fetch is fresh
  await deleteCache(CacheKeys.issue(issueId));

  // Emit update to workspace
  emitToWorkspace(workspaceId, 'issue:updated', {
    issue: updated,
    updatedBy: workspaceId,
  });
  
  return updated;

};

export async function deleteIssue(issueId: string, workspaceId: string) {
  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId),
      eq(issues.workspaceId, workspaceId)
    ),
  });

  if(!issue) throw new AppError('Issue not found', 404);
  
  await db.delete(issues).where(eq(issues.id, issueId));
  
  // bust cache
  await deleteCache(CacheKeys.issue(issueId));

  // Emit deletion to workspace
  emitToWorkspace(workspaceId, 'issue:deleted', {
    issueId,
    workspaceId,
  });
  
  return { message: 'Issue deleted' };

};


// ─── Comments ────────────────────────────────────────────────
export async function addComment(
  issueId: string,
  workspaceId: string,
  content: string,
  authorId: string
) {
  // Verify issue exists in workspace
  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId),
      eq(issues.workspaceId, workspaceId)
    ),
  });
  if (!issue) throw new AppError('Issue not found', 404);

  // add comment
  const [comment] = await db
    .insert(issueComments)
    .values({ issueId, authorId, content })
    .returning();

  // bust issue cache since comments changed
  await deleteCache(CacheKeys.issue(issueId));

  // Emit new comment to workspace
  emitToWorkspace(workspaceId, 'comment:created', {
    comment,
    issueId,
    workspaceId,
  });

  return comment;

};

export async function deleteComment(
  commentId: string,
  authorId: string,
  workspaceId: string
) {
  const comment = await db.query.issueComments.findFirst({
    where: eq(issueComments.id, commentId),
    with: { issue: true }
  });

  if(!comment) throw new AppError('Comment not found', 404);
  if(comment.issue.workspaceId !== workspaceId) throw new AppError('Not found', 404);

  // Only the comment author can delete their comment
  if(comment.authorId !== authorId) throw new AppError('You can only delete your own comments', 403);

  await db.delete(issueComments).where(eq(issueComments.id, commentId));
  return { message: 'Comment deleted' };

};