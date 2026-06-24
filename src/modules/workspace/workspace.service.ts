import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { workspaces, workspaceMembers, users } from '../../db/schema';
import { AppError } from '../../utils/AppError';
import { getCache, setCache, deleteCache, CacheKeys, TTL } from '../../utils/cache';
import type { CreateWorkspaceInput, InviteMemberInput } from './workspace.schema';
import { emailQueue } from '../../queues/email.queue';
import { emitToWorkspace } from '../../socket';

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
};

// creating workspace 
export async function createWorkspace(input: CreateWorkspaceInput, ownerId: string) {
  // check if slug is unique or not
  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, input.slug),
  });

  if(existing) {
    throw new AppError('Slug already taken', 409);
  }

  // Create workspace + add creator as owner in one transaction
  const result = await db.transaction(async (tx) => {
    const [workspace] = await tx
                              .insert(workspaces)
                              .values({...input, ownerId})
                              .returning();
    
    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: ownerId,
      role: 'owner',
    });

    return workspace;
  });
  
  // Bust this user's workspace list cache
  await deleteCache(CacheKeys.userWorkspaces(ownerId));
  
  return result;

};


// Get all workspaces this user is a member of
export async function getMyWorkspaces(userId: string) {
  // Check cache first
  const cacheKey = CacheKeys.userWorkspaces(userId);
  const cached = await getCache<WorkspaceWithRole[]>(cacheKey);
  if(cached) {
    console.log('cache hit: userWorkspaces');
    return cached;
  }

  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: {
      workspace: true, // join workspace data
    },
  });

  // Filter out any memberships where workspace somehow doesn't exist
  const result = memberships
    .filter((m) => m.workspace !== null)
    .map((m) => ({
      ...m.workspace!,  
      role: m.role,
      joinedAt: m.joinedAt,
    }));

  // Store in cache
  await setCache(cacheKey, result, TTL.LONG);
  return result;
};


export async function getWorkspaceBySlug(slug: string, userId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  // check user is a member or not
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId),
    ),
  });

  if (!membership) throw new AppError('You are not a member of this workspace', 403);

  return { ...workspace, role: membership.role };

};

export async function inviteMember(
  workspaceId: string,
  input: InviteMemberInput,
  requesterId: string
) {
  // Only owners and admins can invite
  const requesterMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  });

  if(!requesterMembership || requesterMembership.role === 'member') {
    throw new AppError('Only owners and admins can invite members', 403);
  }

  // Find the user to invite
  const userToInvite = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!userToInvite) throw new AppError('No user found with that email', 404);

  // Check not already a member
  const alreadyMember = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userToInvite.id)
    ),
  });

  if(alreadyMember) throw new AppError('User is already a member', 409);

  const [member] = await db.insert(workspaceMembers)
                    .values({
                      workspaceId,
                      userId: userToInvite.id,
                      role: input.role,
                    }).returning()

  // get workspace name and inviter name for the email
  const [workspace, inviter] = await Promise.all([
    db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) }),
    db.query.users.findFirst({ where: eq(users.id, requesterId) })
  ]);

  // queue invite email
  await emailQueue.add('invite', {
    type: 'invite',
    to: userToInvite.email,
    inviteeName: userToInvite.fullName || userToInvite.username,
    workspaceName: workspace!.name,
    inviterName: inviter!.fullName || inviter!.username, 
  });
    
  // Bust both user's workspace caches + members list
  await Promise.all([
    deleteCache(CacheKeys.userWorkspaces(userToInvite.id)),
    deleteCache(CacheKeys.workspaceMembers(workspaceId)),
  ]);     
  
  // Notify workspace of new member
  emitToWorkspace(workspaceId, 'workspace:member_joined', {
    userId: userToInvite.id,
    email: userToInvite.email,
    username: userToInvite.username,
    role: input.role,
  });

  return member;

};

export async function getWorkspaceMembers(workspaceId: string, requesterId: string) {
  // Verify requester is a member
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  })

  if (!membership) throw new AppError('You are not a member of this workspace', 403);

  // Cache members list
  const cacheKey = CacheKeys.workspaceMembers(workspaceId);
  const cached = await getCache<unknown[]>(cacheKey);
  if (cached) {
    console.log('cache hit: workspaceMembers');
    return cached;
  }

  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatarUrl: true
        },
      },
    },
  });

  await setCache(cacheKey, members, TTL.LONG);
  return members;

};


export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  requesterId: string 
) {
  // Can't remove yourself if you're the owner
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId)
  });
  if (!workspace) throw new AppError('Workspace not found', 404);
  if (workspace.ownerId === targetUserId) throw new AppError('Cannot remove the workspace owner', 403);
  
  // Requester must be owner or admin
  const requesterMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  });

  if(!requesterMembership || requesterMembership.role === 'member') {
    throw new AppError('Only owners and admins can remove members', 403);
  };

  // remove member
  await db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, targetUserId)
          )
        );

  // Bust caches
  await Promise.all([
    deleteCache(CacheKeys.userWorkspaces(targetUserId)),
    deleteCache(CacheKeys.workspaceMembers(workspaceId)),
  ]);

  // Notify workspace of removed member
  emitToWorkspace(workspaceId, 'workspace:member_left', {
    userId: targetUserId,
  });

  return { message: 'Member removed' };
};

